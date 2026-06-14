from __future__ import annotations

from app.schemas.curriculum import CurriculumGraphEdge, CurriculumGraphNode, CurriculumRoadmapData, CurriculumTreeNode


def _make_node(node_id: str, title: str, kind: str, order: int, children: list[CurriculumTreeNode] | None = None) -> CurriculumTreeNode:
    return CurriculumTreeNode(
        id=node_id,
        title=title,
        kind=kind,
        order=order,
        metadata={"preset": "ncert"},
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


NCERT_GRADE_FOCI = {
    "6": "Foundational classroom concepts and observation",
    "7": "Patterns, processes, and guided explanation",
    "8": "Systems, relationships, and applied reasoning",
    "9": "Conceptual depth and structured problem solving",
    "10": "Examination readiness and core synthesis",
    "11": "Advanced theory and analytical structures",
    "12": "Higher-order application and board-level mastery",
}


NCERT_SUBJECT_PRESETS = {
    "physics": [
        ("Measurement and Motion", ["Units and SI system", "Speed and distance", "Graphs and observation"]),
        ("Force and Energy", ["Force and interaction", "Work and energy", "Simple machines"]),
        ("Heat, Light and Sound", ["Heat transfer", "Reflection and refraction", "Sound and vibration"]),
        ("Electricity and Magnetism", ["Current and circuits", "Conductors and insulators", "Magnetic effects"]),
    ],
    "mathematics": [
        ("Number Systems", ["Integers and fractions", "Decimals and percentages", "Powers and roots"]),
        ("Algebra", ["Expressions and equations", "Patterns and sequences", "Linear relationships"]),
        ("Geometry", ["Lines and angles", "Triangles and circles", "Construction and symmetry"]),
        ("Mensuration and Data", ["Area and volume", "Graphs and charts", "Probability basics"]),
    ],
    "chemistry": [
        ("Matter and Its States", ["Particle model", "Changes of state", "Mixtures and solutions"]),
        ("Atoms and Molecules", ["Atomic structure", "Elements and compounds", "Chemical formulae"]),
        ("Chemical Changes", ["Reactions and equations", "Acids and bases", "Metals and non-metals"]),
        ("Everyday Chemistry", ["Water and air", "Carbon compounds", "Materials in life"]),
    ],
    "biology": [
        ("Living World", ["Cells and tissues", "Classification", "Adaptations"]),
        ("Nutrition and Transport", ["Plant nutrition", "Human digestion", "Circulation"]),
        ("Growth and Reproduction", ["Reproduction in plants", "Reproduction in humans", "Health and hygiene"]),
        ("Ecology and Environment", ["Ecosystems", "Biodiversity", "Conservation"]),
    ],
    "computer science": [
        ("Computing Basics", ["Hardware and software", "Operating systems", "Digital files"]),
        ("Algorithms and Logic", ["Step-by-step problem solving", "Flowcharts", "Boolean thinking"]),
        ("Programming Basics", ["Variables and data types", "Conditions and loops", "Functions"]),
        ("Internet and Safety", ["Internet basics", "Communication tools", "Privacy and safety"]),
    ],
}


def _subject_units(grade: str, subject: str) -> list[tuple[str, list[str]]]:
    grade_key = str(grade).strip()
    subject_key = subject.strip().lower()

    if grade_key not in NCERT_GRADE_FOCI:
        raise ValueError(f"Unsupported grade: {grade}")
    if subject_key not in NCERT_SUBJECT_PRESETS:
        raise ValueError(f"Unsupported subject: {subject}")

    grade_focus = NCERT_GRADE_FOCI[grade_key]
    base_units = NCERT_SUBJECT_PRESETS[subject_key]

    return [
        (
            f"{unit_title} - Class {grade_key}",
            [
                f"{topic} ({grade_focus})" if topic_index == 0 else topic
                for topic_index, topic in enumerate(topics)
            ],
        )
        for unit_title, topics in base_units
    ]


def build_ncert_curriculum(title: str, grade: str, subject: str) -> CurriculumRoadmapData:
    units = []
    for unit_index, (unit_title, topics) in enumerate(_subject_units(grade, subject)):
        topic_nodes = [
            _make_node(
                node_id=f"{unit_index + 1}_topic_{topic_index + 1}",
                title=topic_title,
                kind="topic",
                order=topic_index,
            )
            for topic_index, topic_title in enumerate(topics)
        ]
        units.append(
            _make_node(
                node_id=f"unit_{unit_index + 1}",
                title=unit_title,
                kind="unit",
                order=unit_index,
                children=topic_nodes,
            )
        )

    root = _make_node("root", title, "module", 0, units)
    nodes, edges = _flatten_tree(root)

    return CurriculumRoadmapData(
        version="1.0",
        title=title,
        subject=subject,
        grade=grade,
        source_type="ncert",
        source_text=f"NCERT preset scaffold for Class {grade} {subject}",
        source_subject=subject,
        document_id=None,
        root=root,
        nodes=nodes,
        edges=edges,
    )
