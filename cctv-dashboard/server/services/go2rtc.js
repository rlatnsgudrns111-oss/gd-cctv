// server/services/go2rtc.js - go2rtc REST API 연동 서비스

const axios = require('axios');

const GO2RTC_API = process.env.GO2RTC_API_URL || 'http://localhost:1984';

const go2rtcService = {
  // 스트림 추가 (카메라 등록 시 호출)
  async addStream(streamKey, rtspUrl) {
    try {
      await axios.put(`${GO2RTC_API}/api/streams`, {
        [streamKey]: [{ url: rtspUrl }]
      });
      console.log(`[go2rtc] 스트림 추가: ${streamKey}`);
      return true;
    } catch (err) {
      console.error(`[go2rtc] 스트림 추가 실패: ${streamKey}`, err.message);
      return false;
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

module.exports = go2rtcService;
