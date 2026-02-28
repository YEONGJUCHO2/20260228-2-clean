# PayPal MCP 결제 기획서 (ThanQ 앱)

## 1. 목적
ThanQ Pro 멤버십(무제한 대화, 프리미엄 애니메이션 등) 구독 기능을 위한 크로스 플랫폼 결제 모듈 연동.

## 2. 결제 흐름 (Subscription)
1. **결제 프로덕트 등록 (`create_product`)**: 
   - 이름: ThanQ Pro Membership
   - 타입: SERVICE
2. **구독 플랜 생성 (`create_subscription_plan`)**:
   - 빈도: 월정액제 (Monthly)
   - 가격: $4.99/월 등 (유저와 최종 조정)
3. **구독 결제 연결 (`create_subscription`)**: 
   - 프론트엔드에 PayPal 버튼 혹은 구독 결제 링크 렌더링.
   - 결제 완료 시 Firebase Firestore 유저 상태 트리거하여 `isPro: true` 업데이트.

## 3. 실행 단계
1. PayPal MCP를 이용해 Product 생성 → Plan 생성.
2. 각 API 호출을 통해 응답받은 Subscription ID를 Firestore 회원 정보에 매핑.
3. 앱 내 마이페이지에 구독 관리(취소/조회) 기능 제공.
