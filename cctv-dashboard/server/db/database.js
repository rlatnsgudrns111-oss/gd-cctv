// server/db/database.js - Supabase 데이터베이스 클라이언트

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[DB] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 데이터베이스 초기화 (기본 관리자 계정 생성)
async function initializeDatabase() {
  try {
    // 기본 관리자 계정 확인 및 생성
    await createDefaultAdmin();
    console.log('[DB] Supabase 데이터베이스 연결 완료');
  } catch (err) {
    console.error('[DB] 데이터베이스 초기화 오류:', err.message);
  }
}

// 기본 관리자 계정 생성
async function createDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const { data: existingAdmin } = await supabase
    .from('users')
    .select('id')
    .eq('username', adminUsername)
    .single();

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    const { error } = await supabase
      .from('users')
      .insert({ username: adminUsername, password: hashedPassword, role: 'admin' });

    if (error) {
      console.error('[DB] 관리자 계정 생성 오류:', error.message);
    } else {
      console.log(`[DB] 기본 관리자 계정 생성 완료: ${adminUsername}`);
    }
  }
}

// 초기화 실행
initializeDatabase();

module.exports = supabase;
