from manim import *

class Scene1_ForceAndEnergy(Scene):
    def construct(self):
        title = Text("Force and Energy")
        subtitle = Text("Class 9", font_size=28)
        subtitle.next_to(title, DOWN, buff=0.25)

        force_label = Text("Force", font_size=24)
        energy_label = Text("Energy", font_size=24)

        arrow = Arrow(LEFT, RIGHT, buff=0, stroke_width=6)
        arrow.next_to(title, LEFT, buff=1.2)
        force_label.next_to(arrow, UP, buff=0.15)

        circle = Circle(radius=0.35, color=YELLOW)
        circle.set_fill(YELLOW, opacity=0.35)
        circle.next_to(title, RIGHT, buff=1.2)
        energy_label.next_to(circle, DOWN, buff=0.15)

        title_group = VGroup(title, subtitle, arrow, force_label, circle, energy_label)
        title_group.move_to(ORIGIN)

        self.play(FadeIn(title_group, shift=0.2 * UP), run_time=2)
        self.wait(3)
