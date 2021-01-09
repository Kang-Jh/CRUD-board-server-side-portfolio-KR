# CRUD Board Portfolio - Server-side

이 프로젝트는 포트폴리오용 게시판 프로젝트의 서버 사이드를 구현한 프로젝트입니다.
[클라이언트 사이드 프로젝트](https://github.com/Kang-Jh/CRUD-board-client-side-portfolio-KR)와 연동되어 있습니다.

아키텍처는 다음의 링크를 이용하여 구축했습니다.
https://softwareontheroad.com/ideal-nodejs-project-structure/ (영문)

노드 익스프레스와 몽고디비를 이용하여 S3에 글과 이미지를 업로드하는 간단한 CRUD 게시판 서버 사이드 프로젝트입니다.

로그인 시 유저에게 리프레쉬 토큰을 쿠키 형태로 보내고, 이를 바탕으로 클라이언트의 메모리에 저장되는 액세스 토큰을 발급합니다.

## 디렉토리 구조

- dist - 프로젝트를 빌드할 경우 나오는 결과물들의 집합
- src - 프로젝트 개발에 사용되는 모든 파일들의 집합
  - app.ts - 엔트리 포인트
  - api - router들의 집합
    - browser - 클라이언트 엔드포인트
  - config
  - loaders - 익스프레스와 몽고디비 로더
  - middlewares - 익스프레스 미들웨어 집합
  - services - 비즈니스 로직을 처리하는 클래스들의 집합
  - types - 타입스크립트 타입
  - utils - 프로젝트에 필요한 다양한 함수 및 객체들의 집합

[CRUD Board Portfolio](https://example.com)에서 결과물을 확인하실 수 있습니다.
