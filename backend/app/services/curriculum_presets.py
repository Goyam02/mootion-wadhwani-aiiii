from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.schemas.curriculum import CurriculumGraphEdge, CurriculumGraphNode, CurriculumRoadmapData, CurriculumTreeNode


SYLLABUS_PATH = Path(__file__).resolve().parents[1] / "repositories" / "syllabus.json"


def _make_node(node_id: str, title: str, kind: str, order: int, metadata: dict | None = None, children: list[CurriculumTreeNode] | None = None) -> CurriculumTreeNode:
    return CurriculumTreeNode(
        id=node_id,
        title=title,
        kind=kind,
        order=order,
        metadata=metadata or {},
        children=children or [],
    )


def _flatten_tree(node: CurriculumTreeNode, parent_id: str | None = None, nodes: list[CurriculumGraphNode] | None = None, edges: list[CurriculumGraphEdge] | None = None) -> tuple[list[CurriculumGraphNode], list[CurriculumGraphEdge]]:
    if nodes is None:
        nodes = []
    if edges is None:
        edges = []

    nodes.append(
        CurriculumGraphNode(
            id=node.id,
            title=node.title,
            kind=node.kind,
            order=node.order,
            metadata=node.metadata,
        )
    )

    if parent_id is not None:
        edges.append(
            CurriculumGraphEdge(
                id=f"{parent_id}-{node.id}",
                source=parent_id,
                target=node.id,
                kind="contains",
            )
        )

    for index, child in enumerate(node.children):
        child.order = index
        _flatten_tree(child, node.id, nodes, edges)

    return nodes, edges


def _normalize_subject(subject: str) -> str:
    subject_key = subject.strip().lower()
    aliases = {
        "math": "mathematics",
        "maths": "mathematics",
        "mathematics": "mathematics",
        "science": "science",
        "physics": "science",
        "chemistry": "science",
        "biology": "science",
    }
    return aliases.get(subject_key, subject_key)


@lru_cache(maxsize=1)
def _load_syllabus() -> list[dict]:
    if not SYLLABUS_PATH.exists():
        raise FileNotFoundError(f"Syllabus JSON not found at {SYLLABUS_PATH}")

    with SYLLABUS_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, list):
        raise ValueError("syllabus.json must contain a list of class entries")
    return data


def _get_class_entry(grade: str) -> dict:
    grade_key = int(str(grade).strip())
    for entry in _load_syllabus():
        if int(entry.get("class", -1)) == grade_key:
            return entry
    raise ValueError(f"Unsupported grade: {grade}")


def _resolve_subject_entry(class_entry: dict, subject: str) -> tuple[str, dict]:
    subject_key = _normalize_subject(subject)
    subjects = class_entry.get("subjects", {}) or {}

    candidates = [subject_key]
    if subject_key != subject.strip().lower():
        candidates.append(subject.strip().lower())

    for candidate in candidates:
        if candidate in subjects:
            return candidate, subjects[candidate]

    # Fallback to fuzzy contains matching for classroom labels like "Maths"
    for key, value in subjects.items():
        if key in subject_key or subject_key in key:
            return key, value

    raise ValueError(f"Unsupported subject: {subject}")


def build_ncert_curriculum(title: str, grade: str, subject: str) -> CurriculumRoadmapData:
    class_entry = _get_class_entry(grade)
    subject_key, subject_entry = _resolve_subject_entry(class_entry, subject)

    chapter_nodes: list[CurriculumTreeNode] = []
    chapters = subject_entry.get("chapters", []) or []

    try:
        grade_int = int(str(grade).strip())
    except ValueError:
        grade_int = 0

    import re
    subj_clean = subject.strip().lower()
    if grade_int in (11, 12) and subj_clean in ("physics", "chemistry", "biology"):
        target_prefix = subj_clean.capitalize()
        filtered_chapters = []
        for chap in chapters:
            name = chap.get("name") or ""
            if name.startswith(target_prefix):
                # Clean prefix from name
                clean_name = re.sub(rf"^{target_prefix}\s+(Chapter|Unit)\s+\d+:\s*", "", name)
                clean_name = re.sub(rf"^{target_prefix}\s+(Chapter|Unit)\s+\d+\s*[-–—]\s*", "", clean_name)
                
                chap_copy = dict(chap)
                chap_copy["name"] = clean_name
                filtered_chapters.append(chap_copy)
        chapters = filtered_chapters

    for chapter_index, chapter in enumerate(chapters):
        chapter_id = str(chapter.get("id") or f"chapter_{chapter_index + 1}")
        chapter_title = str(chapter.get("name") or chapter_id.replace("-", " ").title())
        topic_nodes = []
        for topic_index, topic in enumerate(chapter.get("topics", []) or []):
            topic_title = str(topic).strip()
            if not topic_title:
                continue
            topic_nodes.append(
                _make_node(
                    node_id=f"{chapter_id}_topic_{topic_index + 1}",
                    title=topic_title,
                    kind="topic",
                    order=topic_index,
                    metadata={
                        "source": "syllabus.json",
                        "class": str(class_entry.get("class")),
                        "subject": subject_key,
                        "chapter_id": chapter_id,
                        "chapter_title": chapter_title,
                        "topic_index": topic_index,
                    },
                )
            )

        chapter_nodes.append(
            _make_node(
                node_id=chapter_id,
                title=chapter_title,
                kind="unit",
                order=chapter_index,
                metadata={
                    "source": "syllabus.json",
                    "class": str(class_entry.get("class")),
                    "subject": subject_key,
                    "chapter_id": chapter_id,
                    "topic_count": len(topic_nodes),
                },
                children=topic_nodes,
            )
        )

    root = _make_node(
        "root",
        title,
        "module",
        0,
        metadata={
            "source": "syllabus.json",
            "class": str(class_entry.get("class")),
            "subject": subject_key,
        },
        children=chapter_nodes,
    )
    nodes, edges = _flatten_tree(root)

    return CurriculumRoadmapData(
        version="1.0",
        title=title,
        subject=subject_key,
        grade=str(class_entry.get("class")),
        source_type="ncert",
        source_text=f"NCERT syllabus from syllabus.json for Class {class_entry.get('class')} {subject_key}",
        source_subject=subject_key,
        document_id=f"ncert-class-{class_entry.get('class')}-{subject_key}",
        root=root,
        nodes=nodes,
        edges=edges,
    )
