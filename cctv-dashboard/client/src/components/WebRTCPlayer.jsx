// client/src/components/WebRTCPlayer.jsx - WebRTC 영상 플레이어 (go2rtc 연동, 최적화)

import React, { useRef, useEffect, useState, useCallback } from 'react';

const GO2RTC_URL = process.env.REACT_APP_GO2RTC_URL || '';

function WebRTCPlayer({ streamKey, status, className = '' }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const retryTimerRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const CONNECT_TIMEOUT = 5000; // 5초 내 연결 안 되면 실패 처리
  const RETRY_DELAY = 2000; // 2초 후 재시도

  // WebRTC 연결 정리
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
  }, []);

  // HLS/MP4 폴백
  const fallbackToHLS = useCallback(() => {
    if (!mountedRef.current) return;
    setConnectionState('hls');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = `${GO2RTC_URL}/api/stream.mp4?src=${streamKey}`;
      videoRef.current.play().catch(() => {
        if (mountedRef.current) setConnectionState('failed');
      });
    }
  }, [streamKey]);

  // WebRTC 연결 시작
  const startWebRTC = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setConnectionState('connecting');

      // 먼저 go2rtc에 스트림이 존재하는지 빠르게 확인
      const checkController = new AbortController();
      const checkTimeout = setTimeout(() => checkController.abort(), 3000);

      try {
        const checkRes = await fetch(`${GO2RTC_URL}/api/streams?src=${streamKey}`, {
          signal: checkController.signal
        });
        clearTimeout(checkTimeout);

        if (!checkRes.ok) {
          if (mountedRef.current) setConnectionState('failed');
          return;
        }

        const streamInfo = await checkRes.json();
        // producers가 없으면 스트림 소스가 없는 것
        if (!streamInfo.producers || streamInfo.producers.length === 0) {
          // 연결 대기 중일 수 있으므로 바로 실패하지 않고 WebRTC 시도
        }
      } catch (e) {
        clearTimeout(checkTimeout);
        // 확인 실패해도 WebRTC 시도는 함
      }

      const pc = new RTCPeerConnection({
        iceServers: [],
        sdpSemantics: 'unified-plan',
      });
      pcRef.current = pc;

      // 비디오만 수신 (오디오 제거로 연결 속도 향상)
      pc.addTransceiver('video', { direction: 'recvonly' });

      // 연결 타임아웃 설정
      connectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && connectionState !== 'connected') {
          console.warn(`[WebRTC] ${streamKey} 연결 타임아웃`);
          handleDisconnect();
        }
      }, CONNECT_TIMEOUT);

      // 트랙 수신 시 비디오 요소에 연결
      pc.ontrack = (event) => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          if (mountedRef.current) {
            setConnectionState('connected');
            setRetryCount(0);
          }
        }
      };

      // 연결 상태 변화 감지
      pc.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        const state = pc.connectionState;
        if (state === 'connected') {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          setConnectionState('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          handleDisconnect();
        }
      };

      // SDP Offer 생성 및 go2rtc에 전송
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${GO2RTC_URL}/api/webrtc?src=${streamKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
        signal: controller.signal,
      });
      clearTimeout(fetchTimeout);

      if (!response.ok) throw new Error('WebRTC 시그널링 실패');

      const answerSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      }));
    } catch (err) {
      if (!mountedRef.current) return;
      console.warn(`[WebRTC] ${streamKey} 연결 실패:`, err.message);
      handleDisconnect();
    }
  }, [streamKey]);

  // 연결 끊김 처리 및 재시도
  const handleDisconnect = useCallback(() => {
    if (!mountedRef.current) return;

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setRetryCount((prev) => {
      const next = prev + 1;
      if (next >= MAX_RETRIES) {
        // 3회 실패 → 바로 HLS 폴백 시도, HLS도 안 되면 failed
        fallbackToHLS();
        return 0;
      }
      setConnectionState('connecting');
      retryTimerRef.current = setTimeout(() => {
        if (mountedRef.current) startWebRTC();
      }, RETRY_DELAY);
      return next;
    });
  }, [fallbackToHLS, startWebRTC]);

  // 컴포넌트 마운트/업데이트 시 연결 시작
  useEffect(() => {
    mountedRef.current = true;
    if (streamKey) {
      startWebRTC();
    } else {
      setConnectionState('failed');
    }
    return cleanup;
  }, [streamKey]);

  return (
    <div className={`relative bg-black overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* 로딩/재연결 오버레이 */}
      {connectionState === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-[10px] text-gray-400">
            {retryCount > 0
              ? `재연결 ${retryCount}/${MAX_RETRIES}`
              : '연결 중...'}
          </span>
        </div>
      )}

      {connectionState === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <svg className="w-8 h-8 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] text-red-400">영상 없음</span>
        </div>
      )}

      {/* HLS 폴백 표시 */}
      {connectionState === 'hls' && (
        <div className="absolute top-1 right-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">MP4</span>
        </div>
      )}
    </div>
  );
}

export default WebRTCPlayer;
