// server/services/go2rtc.js - go2rtc REST API 연동 서비스

const axios = require('axios');

const GO2RTC_API = process.env.GO2RTC_API_URL || 'http://localhost:1984';

// RTSP URL의 비밀번호에 @가 있으면 %40으로 인코딩
function encodeRtspPassword(rtspUrl) {
  try {
    const match = rtspUrl.match(/^(rtsp:\/\/)([^:]+):(.+)@([^@]+)$/);
    if (match) {
      const [, prefix, user, password, host] = match;
      const encodedPassword = password.replace(/@/g, '%40');
      return `${prefix}${user}:${encodedPassword}@${host}`;
    }
    return rtspUrl;
  } catch {
    return rtspUrl;
  }
}

const go2rtcService = {
  // 스트림 추가 (카메라 등록 시 호출)
  async addStream(streamKey, rtspUrl) {
    try {
      const encodedUrl = encodeRtspPassword(rtspUrl);
      // 먼저 일반 RTSP로 등록
      await axios.put(`${GO2RTC_API}/api/streams?name=${encodeURIComponent(streamKey)}&src=${encodeURIComponent(encodedUrl)}`);
      console.log(`[go2rtc] 스트림 추가: ${streamKey}`);

      return true;
    } catch (err) {
      console.error(`[go2rtc] 스트림 추가 실패: ${streamKey}`, err.message);
      return false;
    }
  },

  // H265 감지 시 ffmpeg 변환 소스로 교체
  async checkAndAddTranscoding(streamKey, rtspUrl) {
    try {
      // 잠시 대기 후 코덱 확인
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await axios.get(`${GO2RTC_API}/api/streams?src=${streamKey}`);
      const stream = response.data;

      if (stream && stream.producers) {
        const isH265 = stream.producers.some(p =>
          (p.medias && p.medias.some(m => m.includes('H265'))) ||
          (p.sdp && p.sdp.includes('H265'))
        );

        if (isH265) {
          // H265이면 기존 스트림 삭제 후 ffmpeg 변환으로 재등록
          await axios.delete(`${GO2RTC_API}/api/streams?src=${streamKey}`);
          const ffmpegSrc = `ffmpeg:${rtspUrl}#video=h264`;
          await axios.put(`${GO2RTC_API}/api/streams?name=${encodeURIComponent(streamKey)}&src=${encodeURIComponent(ffmpegSrc)}`);
          console.log(`[go2rtc] ${streamKey}: H265 감지 → ffmpeg H264 변환 적용`);
        }
      }
    } catch (err) {
      // 코덱 확인 실패해도 기본 스트림은 유지
      console.warn(`[go2rtc] ${streamKey} 코덱 확인 실패:`, err.message);
    }
  },

  // 스트림 제거 (카메라 삭제 시 호출)
  async removeStream(streamKey) {
    try {
      await axios.delete(`${GO2RTC_API}/api/streams?src=${streamKey}`);
      console.log(`[go2rtc] 스트림 제거: ${streamKey}`);
      return true;
    } catch (err) {
      console.error(`[go2rtc] 스트림 제거 실패: ${streamKey}`, err.message);
      return false;
    }
  },

  // 전체 스트림 상태 조회
  async getStreams() {
    try {
      const response = await axios.get(`${GO2RTC_API}/api/streams`);
      return response.data;
    } catch (err) {
      console.error('[go2rtc] 스트림 목록 조회 실패:', err.message);
      return null;
    }
  },

  // 특정 스트림 상태 확인
  async getStreamStatus(streamKey) {
    try {
      const streams = await this.getStreams();
      if (!streams) return 'unknown';

      const stream = streams[streamKey];
      if (!stream) return 'offline';

      // producers가 있으면 연결됨
      if (stream.producers && stream.producers.length > 0) {
        return 'online';
      }
      return 'offline';
    } catch (err) {
      return 'unknown';
    }
  },

  // 전체 카메라 상태 일괄 조회
  async getAllStreamStatuses(cameras) {
    try {
      const streams = await this.getStreams();
      if (!streams) {
        return cameras.map(cam => ({ ...cam, liveStatus: 'unknown' }));
      }

      return cameras.map(cam => {
        const stream = streams[cam.stream_key];
        let liveStatus = 'offline';
        if (stream && stream.producers && stream.producers.length > 0) {
          liveStatus = 'online';
        }
        return { ...cam, liveStatus };
      });
    } catch (err) {
      return cameras.map(cam => ({ ...cam, liveStatus: 'unknown' }));
    }
  }
};

// 서버 시작 시 Supabase에서 카메라 목록을 가져와 go2rtc에 자동 등록
async function syncStreamsFromDB() {
  try {
    const supabase = require('../db/database');
    const { data: cameras, error } = await supabase
      .from('cameras')
      .select('stream_key, rtsp_url');

    if (error) throw error;
    if (!cameras || cameras.length === 0) {
      console.log('[go2rtc] 등록된 카메라 없음');
      return;
    }

    // 이미 go2rtc.yaml에 등록된 스트림은 건너뛰기
    const existingStreams = await go2rtcService.getStreams() || {};

    let success = 0;
    for (const cam of cameras) {
      if (existingStreams[cam.stream_key]) {
        console.log(`[go2rtc] ${cam.stream_key} 이미 등록됨 (yaml), 건너뜀`);
        success++;
        continue;
      }
      const result = await go2rtcService.addStream(cam.stream_key, cam.rtsp_url);
      if (result) success++;
    }
    console.log(`[go2rtc] Supabase에서 ${success}/${cameras.length}개 스트림 등록 완료`);
  } catch (err) {
    console.error('[go2rtc] 스트림 동기화 실패:', err.message);
  }
}

go2rtcService.syncStreamsFromDB = syncStreamsFromDB;

module.exports = go2rtcService;
