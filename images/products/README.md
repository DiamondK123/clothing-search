# 商品攝影照片資料夾

此資料夾存放已取得適當使用授權的商品照片。

## 命名規則

- 建議以 TiDB Cloud 的 product_id 為準：product-001.jpg、product-002.jpg 等。
- 建議使用 JPG 或 WebP；商品主圖建議統一長寬比例 3:4。
- 照片應與商品名稱、類別及顏色相符。
- 上傳前確認照片的著作權及商業使用授權；不要直接複製網路照片。
- 上傳圖片後，才更新 clothing.image_url；切勿先把資料庫指向尚不存在的圖片。

## GitHub Pages 圖片 URL 範例

https://diamondk123.github.io/clothing-search/images/products/product-001.jpg

## 資料庫更新範例（確認商品 ID 與檔案實際存在後才執行）

```sql
UPDATE clothing
SET image_url = 'https://diamondk123.github.io/clothing-search/images/products/product-001.jpg'
WHERE product_id = 1;
```

目前既有 60 筆資料庫圖片網址不變，網站仍使用既有圖片及載入失敗備援機制。
