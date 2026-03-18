// client/src/components/WebRTCPlayer.jsx - WebRTC 영상 플레이어 (go2rtc 연동)

import React, { useRef, useEffect, useState, useCallback } from 'react';

const GO2RTC_URL = process.env.REACT_APP_GO2RTC_URL || '';

function WebRTCPlayer({ streamKey, status, className = '' }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const retryTimerRef = useRef(null);
  const [connectionState, setConnectionState] = useState('connecting'); // connecting, connected, failed, hls
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;

  // WebRTC 연결 정리
  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
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

  // HLS 폴백
  const fallbackToHLS = useCallback(() => {
    setConnectionState('hls');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = `${GO2RTC_URL}/api/stream.mp4?src=${streamKey}`;
      videoRef.current.play().catch(() => {});
    }
  }, [streamKey]);

  // WebRTC 연결 시작
  const startWebRTC = useCallback(async () => {
    if (status === 'offline') {
      setConnectionState('failed');
      return;
    }

    try {
      setConnectionState('connecting');

      const pc = new RTCPeerConnection({
        iceServers: [],
        sdpSemantics: 'unified-plan',
      });
      pcRef.current = pc;

      // 비디오/오디오 트랜시버 추가
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // 트랙 수신 시 비디오 요소에 연결
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionState('connected');
          setRetryCount(0);
        }
      };

      // 연결 상태 변화 감지
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'disconnected' || state === 'failed') {
          handleDisconnect();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          handleDisconnect();
        }
      };

      // SDP Offer 생성 및 go2rtc에 전송
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(`${GO2RTC_URL}/api/webrtc?src=${streamKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });

      if (!response.ok) throw new Error('WebRTC 시그널링 실패');

      const answerSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      }));
    } catch (err) {
      console.warn(`[WebRTC] ${streamKey} 연결 실패:`, err.message);
      handleDisconnect();
    }
  }, [streamKey, status]);

  // 연결 끊김 처리 및 재시도
  const handleDisconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setRetryCount((prev) => {
      const next = prev + 1;
      if (next >= MAX_RETRIES) {
        // 최대 재시도 초과 → HLS 폴백
        fallbackToHLS();
        return 0;
      }
      setConnectionState('connecting');
      // 5초 후 재시도
      retryTimerRef.current = setTimeout(() => {
        startWebRTC();
      }, 5000);
      return next;
    });
  }, [fallbackToHLS, startWebRTC]);

  // 컴포넌트 마운트/업데이트 시 연결 시작
  useEffect(() => {
    if (streamKey && status !== 'offline') {
      startWebRTC();
    } else {
      setConnectionState('failed');
    }
    return cleanup;
  }, [streamKey, status, startWebRTC, cleanup]);

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
          {/* 스켈레톤 애니메이션 */}
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-gray-400">
            {retryCount > 0
              ? `재연결 시도 중... ${retryCount}회`
              : '영상 로딩 중...'}
          </span>
        </div>
      )}

      {connectionState === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <svg className="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-red-400">영상 없음</span>
        </div>
      )}

      {/* HLS 폴백 표시 */}
      {connectionState === 'hls' && (
        <div className="absolute top-1 right-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">HLS</span>
        </div>
      )}
    </div>
  );
}

export default WebRTCPlayer;
