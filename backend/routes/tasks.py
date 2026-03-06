from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from database import get_database
from models.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from middleware.auth import get_current_user
from utils.encryption import encrypt, decrypt

router = APIRouter()


def encrypt_task_fields(title: str, description: str) -> dict:
    """Encrypt sensitive task fields before storage."""
    return {
        "title": encrypt(title),
        "description": encrypt(description),
    }


def decrypt_task_doc(doc: dict) -> TaskResponse:
    """Decrypt a task document from MongoDB into a response model."""
    return TaskResponse(
        id=str(doc["_id"]),
        title=decrypt(doc["title"]),
        description=decrypt(doc["description"]),
        status=doc["status"],
        priority=doc.get("priority", "medium"),
        user_id=doc["user_id"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.get("/")
async def get_tasks(
    request: Request,
    status: Optional[TaskStatus] = Query(default=None),
):
    """Get all tasks for the authenticated user."""
    user_id = await get_current_user(request)
    db = get_database()

    query = {"user_id": user_id}
    if status:
        query["status"] = status.value

    tasks = []
    async for doc in db.tasks.find(query).sort("created_at", -1):
        try:
            tasks.append(decrypt_task_doc(doc))
        except Exception:
            # Skip tasks that can't be decrypted
            continue

    return tasks


@router.post("/", status_code=201)
async def create_task(task: TaskCreate, request: Request):
    """Create a new task with encrypted fields."""
    user_id = await get_current_user(request)
    db = get_database()

    now = datetime.now(timezone.utc).isoformat()
    encrypted = encrypt_task_fields(task.title, task.description or "")

    doc = {
        **encrypted,
        "status": task.status.value,
        "priority": task.priority or "medium",
        "user_id": user_id,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.tasks.insert_one(doc)
    doc["_id"] = result.inserted_id
    return decrypt_task_doc(doc)


@router.put("/{task_id}")
async def update_task(task_id: str, task: TaskUpdate, request: Request):
    """Update a task (only owner can update)."""
    user_id = await get_current_user(request)
    db = get_database()

    try:
        obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    existing = await db.tasks.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if task.title is not None:
        update_data["title"] = encrypt(task.title)
    if task.description is not None:
        update_data["description"] = encrypt(task.description)
    if task.status is not None:
        update_data["status"] = task.status.value
    if task.priority is not None:
        update_data["priority"] = task.priority

    await db.tasks.update_one({"_id": obj_id}, {"$set": update_data})

    updated = await db.tasks.find_one({"_id": obj_id})
    return decrypt_task_doc(updated)


@router.delete("/{task_id}")
async def delete_task(task_id: str, request: Request):
    """Delete a task (only owner can delete)."""
    user_id = await get_current_user(request)
    db = get_database()

    try:
        obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID")

    existing = await db.tasks.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    await db.tasks.delete_one({"_id": obj_id})
    return {"message": "Task deleted successfully"}
