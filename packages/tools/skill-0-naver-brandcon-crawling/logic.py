import os
import time
import requests
import json
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from pathlib import Path
from typing import Dict, Any, List, Optional

class NaverAssetAnalyzer:
    """
    [Skill-0-01] 네이버 에셋 분석기 (독립형 엔진)
    - 브라우저 제어 및 데이터 수집을 하나의 클래스 내에서 완결함
    - 외부 의존성 없이 독립적으로 실행 가능
    """
    def __init__(self, output_base: str = "packages/data/01_재료_하차장/NAVER"):
        self.driver = None
        self.project_root = Path(os.getcwd())
        self.output_dir = self.project_root / output_base
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _setup_driver(self):
        if self.driver: return self.driver
        
        chrome_options = Options()
        chrome_options.add_argument("--headless") # 배경 가동 (독립 실행 최적화)
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.exclude_switches = ["enable-logging"]

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        return self.driver

    def filter_url(self, url: str) -> str:
        if not url: return ""
        clean_url = url.split('?')[0].strip()
        if clean_url.endswith('/'): clean_url = clean_url[:-1]
        return clean_url

    def parse_product_data(self, html_content: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 1. 상품 정보 추출 (선택자 강화)
        title_tag = soup.select_one('h3.DCVBehA8ZB._copyable')
        title = title_tag.get_text(strip=True) if title_tag else "Unnamed_Product"

        price_tag = soup.select_one('strong.Xu9MEKUuIo span.e1DMQNBPJ_')
        price = price_tag.get_text(strip=True).replace(',', '') if price_tag else "0"
        
        original_price_tag = soup.select_one('del.VaZJPclpdJ span.e1DMQNBPJ_')
        original_price = original_price_tag.get_text(strip=True).replace(',', '') if original_price_tag else price

        # 2. 리뷰 및 이미지 추출
        review_elements = soup.select('.vhlVUsCtw3 span.K0kwJOXP06')[:5]
        reviews = [r.get_text(strip=True) for r in review_elements if r.get_text(strip=True)]

        image_urls = []
        main_img = soup.select_one('img.TgO1N1wWTm')
        if main_img and main_img.has_attr('src'):
            image_urls.append(main_img['src'].split('?')[0] + "?type=m1000_pd")
            
        sub_imgs = soup.select('img.fxmqPhYp6y')
        for simg in sub_imgs[:8]:
            if simg.has_attr('src'):
                src = simg['src'].split('?')[0] + "?type=m1000_pd"
                if src not in image_urls: image_urls.append(src)

        return {
            "title": title,
            "price": f"{price}원",
            "original_price": f"{original_price}원",
            "discount_rate": soup.select_one('.ZrsHt2mzIY span.blind').get_text(strip=True) if soup.select_one('.ZrsHt2mzIY span.blind') else "0%",
            "rating": soup.select_one('.nI8wdMPKHV.AofCh70CRy strong.rIXQgoa8Xl').get_text(strip=True).replace("평점", "") if soup.select_one('.nI8wdMPKHV.AofCh70CRy strong.rIXQgoa8Xl') else "0.0",
            "reviews": reviews,
            "images": image_urls
        }

    async def run_analysis(self, keyword: str, url: str) -> Dict[str, Any]:
        """
        [독립 액션] 분석 후 결과 JSON 및 이미지를 독립된 폴더에 저장
        """
        driver = self._setup_driver()
        try:
            target_url = self.filter_url(url)
            driver.get(target_url)
            time.sleep(3) 

            data = self.parse_product_data(driver.page_source)
            data['source_url'] = url
            data['analyzed_at'] = datetime.now().isoformat()

            # 저장 경로 확보
            save_path = self.output_dir / keyword.strip()
            save_path.mkdir(parents=True, exist_ok=True)

            # JSON 저장
            with open(save_path / "metadata.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            # 이미지 다운로드 (독립 함수)
            await self._download_assets(save_path, data['images'], keyword)

            return {"status": "success", "path": str(save_path), "data": data}
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            self.close()

    async def _download_assets(self, path: Path, urls: List[str], keyword: str):
        headers = {'User-Agent': 'Mozilla/5.0'}
        for i, url in enumerate(urls, 1):
            try:
                res = requests.get(url, headers=headers, timeout=10)
                if res.status_code == 200:
                    with open(path / f"img_{i:02d}.jpg", 'wb') as f:
                        f.write(res.content)
            except: continue

    def close(self):
        if self.driver:
            self.driver.quit()
            self.driver = None

from datetime import datetime
if __name__ == "__main__":
    # 독립 테스트 실행부
    import asyncio
    analyzer = NaverAssetAnalyzer()
    async def test():
        res = await analyzer.run_analysis("테스트상품", "https://smartstore.naver.com/some-product")
        print(res)
    asyncio.run(test())
