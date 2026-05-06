from manim import *

class Scene1_IntroductiontoNewtonsLawsofMotion(Scene):
    def construct(self):
        title = Text("Newton's Laws of Motion").to_edge(UP)
        box1 = Square(side_length=1).set_fill(BLUE, opacity=0.5).set_stroke(BLUE, width=2)
        box2 = Square(side_length=1).set_fill(GREEN, opacity=0.5).set_stroke(GREEN, width=2)
        box3 = Square(side_length=1).set_fill(RED, opacity=0.5).set_stroke(RED, width=2)
        box1.move_to(3*LEFT + DOWN)
        box2.move_to(DOWN)
        box3.move_to(3*RIGHT + DOWN)
        label1 = MathTex(r"1").move_to(box1.get_center())
        label2 = MathTex(r"2").move_to(box2.get_center())
        label3 = MathTex(r"3").move_to(box3.get_center())
        self.play(Write(title))
        self.wait(1)
        self.play(Create(box1), Write(label1))
        self.wait(1)
        self.play(Create(box2), Write(label2))
        self.wait(1)
        self.play(Create(box3), Write(label3))
        self.wait(2)

class Scene2_FirstLawLawofInertia(Scene):
    def construct(self):
        # Stationary circle on left
        circle_rest = Circle(radius=0.5, color=BLUE).to_edge(LEFT).shift(UP*0.5)
        label_rest = Tex("Object at Rest").next_to(circle_rest, DOWN)
        # Moving circle on right
        circle_motion = Circle(radius=0.5, color=GREEN).to_edge(LEFT).shift(DOWN*1.5 + RIGHT*2)
        label_motion = Tex("Object in Motion").next_to(circle_motion, DOWN)
        # Arrow for motion (constant speed)
        motion_arrow = Arrow(start=circle_motion.get_left(), end=circle_motion.get_right() + RIGHT*1.5, buff=0, color=GREEN)
        # External force arrow
        force_arrow = Arrow(start=circle_motion.get_right() + RIGHT*0.2, end=circle_motion.get_right() + RIGHT*2, buff=0, color=RED)
        force_label = Tex("External Force").next_to(force_arrow, UP)

        self.play(Create(circle_rest), Write(label_rest))
        self.wait(1)
        self.play(Create(circle_motion), Write(label_motion))
        self.wait(1)
        self.play(Create(motion_arrow))
        self.wait(1)
        self.play(Create(force_arrow), Write(force_label))
        self.wait(1)

        # Animate acceleration: move circle_motion to right with increasing speed
        self.play(circle_motion.animate.shift(RIGHT*2), motion_arrow.animate.shift(RIGHT*2), force_arrow.animate.shift(RIGHT*2), force_label.animate.shift(RIGHT*2), label_motion.animate.shift(RIGHT*2), run_time=2)
        self.wait(2)

class Scene3_SecondLawLawofAccelerationFma(Scene):
    def construct(self):
        formula = MathTex(r"F", r"=", r"m", r"\times", r"a").scale(2).to_edge(UP)
        self.play(Write(formula))
        self.wait(2)

        # Two squares of different sizes
        square_small = Square(side_length=1, color=BLUE).shift(LEFT*3 + DOWN*0.5)
        label_small = MathTex(r"m_1 < m_2").next_to(square_small, DOWN)
        square_large = Square(side_length=1.8, color=GREEN).shift(RIGHT*2 + DOWN*0.5)
        label_large = MathTex(r"m_2").next_to(square_large, DOWN)

        # Equal force arrows pushing both squares
        force_arrow_small = Arrow(start=square_small.get_left() + LEFT*0.2, end=square_small.get_left() + LEFT*1.2, color=RED)
        force_arrow_large = Arrow(start=square_large.get_left() + LEFT*0.2, end=square_large.get_left() + LEFT*1.2, color=RED)

        # Motion arrows showing acceleration
        accel_arrow_small = Arrow(start=square_small.get_right(), end=square_small.get_right() + RIGHT*3, color=YELLOW)
        accel_arrow_large = Arrow(start=square_large.get_right(), end=square_large.get_right() + RIGHT*1.5, color=YELLOW)

        # Labels for arrows
        force_label_small = MathTex(r"\text{Force} = F").next_to(force_arrow_small, UP)
        force_label_large = MathTex(r"\text{Force} = F").next_to(force_arrow_large, UP)
        accel_label_small = MathTex(r"a_1").next_to(accel_arrow_small, UP)
        accel_label_large = MathTex(r"a_2").next_to(accel_arrow_large, UP)

        self.play(Create(square_small), Write(label_small))
        self.play(Create(square_large), Write(label_large))
        self.wait(1)
        self.play(Create(force_arrow_small), Write(force_label_small))
        self.play(Create(force_arrow_large), Write(force_label_large))
        self.wait(1)
        self.play(Create(accel_arrow_small), Write(accel_label_small))
        self.play(Create(accel_arrow_large), Write(accel_label_large))
        self.wait(2)

class Scene4_ThirdLawLawofActionandReaction(Scene):
    def construct(self):
        # Two circles facing each other
        objA = Circle(radius=0.7, color=BLUE).shift(LEFT*2)
        labelA = Tex("Object A").next_to(objA, DOWN)
        objB = Circle(radius=0.7, color=GREEN).shift(RIGHT*2)
        labelB = Tex("Object B").next_to(objB, DOWN)

        # Arrows between objects
        arrow_AB = Arrow(start=objA.get_right(), end=objB.get_left(), color=RED)
        arrow_BA = Arrow(start=objB.get_left(), end=objA.get_right(), color=RED)

        # Labels for arrows
        label_AB = Tex("Action Force").next_to(arrow_AB, UP)
        label_BA = Tex("Reaction Force").next_to(arrow_BA, DOWN)

        self.play(Create(objA), Write(labelA))
        self.play(Create(objB), Write(labelB))
        self.wait(1)
        self.play(Create(arrow_AB), Write(label_AB))
        self.play(Create(arrow_BA), Write(label_BA))
        self.wait(2)

class Scene5_SummaryofNewtonsLaws(Scene):
    def construct(self):
        # Bullet points text
        bullet1 = Tex(r"\textbullet\ First Law: Object remains at rest or in uniform motion unless acted upon by a force.")
        bullet2 = Tex(r"\textbullet\ Second Law: F = m \times a")
        bullet3 = Tex(r"\textbullet\ Third Law: For every action, there is an equal and opposite reaction.")

        bullet1.to_edge(UP).shift(LEFT*2 + UP*0.5)
        bullet2.next_to(bullet1, DOWN, aligned_edge=LEFT).shift(LEFT*0.2)
        bullet3.next_to(bullet2, DOWN, aligned_edge=LEFT).shift(LEFT*0.2)

        # Icons
        # First law icon: stationary and moving circle
        circle_rest = Circle(radius=0.3, color=BLUE).next_to(bullet1, LEFT)
        circle_motion = Circle(radius=0.3, color=GREEN).next_to(circle_rest, RIGHT, buff=0.3)
        motion_arrow = Arrow(start=circle_motion.get_left(), end=circle_motion.get_right() + RIGHT*0.5, color=GREEN, buff=0)

        # Second law icon: formula
        formula_icon = MathTex(r"F=ma").scale(0.7).next_to(bullet2, LEFT)

        # Third law icon: two opposing arrows
        arrow1 = Arrow(start=ORIGIN, end=LEFT, color=RED).scale(0.7).next_to(bullet3, LEFT, buff=0.5)
        arrow2 = Arrow(start=ORIGIN, end=RIGHT, color=RED).scale(0.7).next_to(arrow1, RIGHT, buff=0.1)

        self.play(Write(bullet1))
        self.play(Create(circle_rest), Create(circle_motion), Create(motion_arrow))
        self.wait(1)
        self.play(Write(bullet2))
        self.play(Write(formula_icon))
        self.wait(1)
        self.play(Write(bullet3))
        self.play(Create(arrow1), Create(arrow2))
        self.wait(3)