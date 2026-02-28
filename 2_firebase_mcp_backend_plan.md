# Firebase MCP 백엔드 기획서 (ThanQ 앱)

## 1. 목적
ThanQ 앱의 크로스 플랫폼 버전에 필요한 사용자 인증, 실시간 데이터 동기화, 호스팅, 데이터베이스 스키마 설계 및 배포.

## 2. 연동할 Firebase 서비스
- **Firebase Authentication**: Google 로그인 및 이메일 회원가입 (웹, iOS, Android 동시 지원)
- **Cloud Firestore**: 
  - `users`: 목표 설정, 미션 정보, 구독 상태 등
  - `items`: 버린 물건, 보류한 물건(위시리스트) 내역, 해당 아이템과 연관된 감성 메시지
  - `rankings`: 주간 랭킹 보드 데이터
- **Firebase Hosting / App Distribution**:
  - 웹 버전 배포 (Hosting)

## 3. 실행 단계
1. `firebase_get_environment`로 사용자/프로젝트 연결 상태 확인.
2. `firebase_create_project`로 신규 프로젝트(thanq) 생성 혹은 연동.
3. `firebase_init` (Firestore, Auth, Hosting 기능 선택).
4. Firestore 보안 규칙(`firebase_get_security_rules`, `firebase_validate_security_rules`)을 설정하여 데이터 무결성 보장.
