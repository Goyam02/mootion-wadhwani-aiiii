from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import ChapterAsset
from app.services.media_service import stream_minio_object


router = APIRouter(prefix="/media", tags=["media"])


@router.get("/assets/{asset_id}")
def asset_media(asset_id: str, db: Session = Depends(get_db)):
    asset = db.get(ChapterAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Media asset not found")

    if asset.storage_bucket and asset.storage_key:
        obj = stream_minio_object(asset.storage_bucket, asset.storage_key)

        def iter_file():
            try:
                while True:
                    chunk = obj.read(1024 * 1024)
                    if not chunk:
                        break
                    yield chunk
            finally:
                obj.close()
                obj.release_conn()

        return StreamingResponse(
            iter_file(),
            media_type=(asset.payload_json.get("storage", {}) or {}).get("content_type", "video/mp4"),
            headers={"Cache-Control": "public, max-age=3600"},
        )

    if asset.external_url:
        return RedirectResponse(asset.external_url, status_code=302)

    raise HTTPException(status_code=404, detail="Media asset not available")
