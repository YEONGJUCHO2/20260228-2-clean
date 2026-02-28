# Antigravity 크로스 플랫폼 개발 기획서 (ThanQ 앱)

## 1. 목적
웹, 안드로이드, iOS를 모두 아우르는 단일 코드베이스(Cross-Platform)로 정리 멘탈케어 앱 ThanQ 완성.

## 2. 기술 스택
- **코어 프레임워크**: Expo (React Native 기반) — 웹 프론트엔드와 네이티브 모바일 앱(안드로이드, iOS)을 한 번에 빌드 가능.
- **스타일링**: TailwindCSS / NativeWind 혹은 StyleSheet (크로스 플랫폼 호환).
- **AI 연동**: `@google/generative-ai` 모듈로 Gemini Flash API 바로 활용 (이미지 인식 및 마스코트 챗봇).
- **네비게이션**: Expo Router (파일 기반 라우팅 지원).
- **상태 관리**: Zustand (미션 및 뱃지 상태).

## 3. 기능 개발 우선순위
1. **스캐폴딩**: `npx create-expo-app thanq`를 통해 기본 구조 마련 및 웹/모바일 포팅 테스트.
2. **카메라/이미지 업로드**: 모바일 네이티브 카메라 리소스와 웹 카메라 리소스 연동. (`expo-camera` 또는 `expo-image-picker`)
3. **AI 챗봇 로직**: Gemini Flash 프롬프트 세팅 및 대화 턴 제한 (3~5회 제어 로직).
4. **리스트/애니메이션**: Lottie나 React Native Reanimated를 사용한 크로스 플랫폼 애니메이션 플로우(파티클 이펙트) 구현.
