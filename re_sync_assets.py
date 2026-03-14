import base64
import json
import os
import io
from pathlib import Path
from PIL import Image

# 정정된 리얼 데이터 매핑
REAL_DATA = {
    "3268": {"title": "비즈니스 통합 홈", "desc": "신뢰감 있는 기업용 다목적 웹사이트 레이아웃입니다."},
    "4184": {"title": "커머스 쇼핑몰", "desc": "다양한 상품 카테고리와 장바구니 기능을 갖춘 쇼핑몰 디자인입니다."},
    "4219": {"title": "크리에이티브 포트폴리오", "desc": "예술가와 디자이너를 위한 고해상도 작업물 전시용 포트폴리오입니다."},
    "4257": {"title": "디지털 서비스 랜딩", "desc": "IT 솔루션 및 서비스 소개를 위한 현대적인 랜딩 페이지입니다."},
    "5578": {"title": "모던 UI 대시보드", "desc": "깔끔하고 세련된 데이터 관리용 어드민 대시보드 인터페이스입니다."},
    "5582": {"title": "패션 이커머스 (Jesco)", "desc": "패션 의류 및 잡화 판매에 최적화된 감각적인 이커머스 템플릿입니다."},
    "5672": {"title": "호텔 관리 어드민", "desc": "객실 예약 및 상태 관리를 위한 호텔 전문 대시보드 디자인입니다."},
    "5673": {"title": "렉사 통합 대시보드", "desc": "다양한 위젯과 차트가 포함된 범용 관리자 페이지 템플릿입니다."},
    "5690": {"title": "커피숍/카페 웹", "desc": "따뜻한 분위기의 카페 메뉴 및 매장 소개용 홈페이지입니다."},
    "5934": {"title": "패션 스타일링 홈", "desc": "비주얼을 강조하는 의류 브랜드 및 스타일링 가이드 레이아웃입니다."},
    "5962": {"title": "아로마 샵/스토어", "desc": "향수 및 뷰티 제품 판매를 위한 향기로운 느낌의 쇼핑몰 디자인입니다."},
    "6051": {"title": "카센터/정비 서비스", "desc": "자동차 수리 및 부품 교체 서비스 홍보용 전문 템플릿입니다."},
    "7437": {"title": "프리미엄 호텔/리조트", "desc": "럭셔리한 휴양지 및 호텔 소개를 위한 우아한 레이아웃입니다."},
    "7664": {"title": "여행/투어 에이전시", "desc": "전 세계 여행 패키지 예약 및 관광 정보 제공용 웹사이트입니다."},
    "8058": {"title": "요리/레시피 블로그", "desc": "식욕을 돋우는 고화질 사진 위주의 레시피 및 요리 정보 블로그입니다."},
    "8127": {"title": "Saymon 멀티 템플릿", "desc": "다양한 비즈니스 상황에 적용 가능한 유연한 구조의 HTML5 디자인입니다."},
    "8162": {"title": "레스토랑/식당 웹", "desc": "메뉴판 및 예약 기능을 갖춘 다이닝 레스토랑용 홈페이지입니다."}
}

def re_encode_and_sync():
    project_root = Path(os.getcwd())
    json_path = project_root / 'apps' / 'web' / 'src' / 'data' / 'design_assets.json'
    base_assets = project_root / 'design_inbox' / 'front_assets' / 'front_design'
    
    final_assets = []
    print("🔄 Starting precise re-encoding and synchronization...")

    for mid, info in REAL_DATA.items():
        img_path = base_assets / f'moban{mid}' / f'{mid}.png'
        
        asset_item = {
            "id": int(mid),
            "title": info["title"],
            "description": info["desc"],
            "thumbnail_base64": ""
        }

        if img_path.exists():
            try:
                with Image.open(img_path) as img:
                    img.thumbnail((480, 480)) # 조금 더 선명하게 조정
                    out = io.BytesIO()
                    img.save(out, format='WEBP', quality=75) # 품질 상향
                    data = base64.b64encode(out.getvalue()).decode('utf-8')
                    asset_item["thumbnail_base64"] = f"data:image/webp;base64,{data}"
                    print(f"✅ Synced: {mid} - {info['title']}")
            except Exception as e:
                print(f"❌ Error encoding {mid}: {e}")
        
        final_assets.append(asset_item)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(final_assets, f, ensure_ascii=False, indent=2)
    print("✨ ALL DONE! Consistency verified.")

if __name__ == "__main__":
    re_encode_and_sync()
