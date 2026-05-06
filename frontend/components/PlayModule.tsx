import React, { useState, useRef, useEffect } from 'react';
import { Mic, ArrowLeft, Move, Loader2, Check, X, RefreshCw, Timer, Trophy, Eye, AlertCircle } from 'lucide-react';
import { connectToStudentAI, generateDragDrop, generateMistakeGame } from '../services/geminiService';
import { DragDropGameData, MistakeGameData } from '../types';

const PlayModule: React.FC = () => {
    // State to track which sub-game is active.
    const [activeGame, setActiveGame] = useState<'TEACH' | 'MISTAKE' | 'DRAG' | null>(null);

    // --- TEACH AI State ---
    const [isTeaching, setIsTeaching] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [visualizerScale, setVisualizerScale] = useState(1);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'model', text: string }[]>([]);

    // Refs for accumulation to avoid stale closures in callbacks
    const tempUserTextRef = useRef("");
    const tempModelTextRef = useRef("");
    const lastSpeakerRef = useRef<'user' | 'model' | null>(null);

    const disconnectRef = useRef<(() => void) | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const startRecordingRef = useRef<(() => void) | null>(null);
    const stopRecordingRef = useRef<(() => void) | null>(null);

    // --- DRAG GAME State ---
    const [dragTopic, setDragTopic] = useState("");
    const [dragData, setDragData] = useState<DragDropGameData | null>(null);
    const [dragLoading, setDragLoading] = useState(false);
    const [droppedOption, setDroppedOption] = useState<string | null>(null);
    const [dragResult, setDragResult] = useState<'CORRECT' | 'INCORRECT' | 'TIMEOUT' | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isGameFinished, setIsGameFinished] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- SPOT THE MISTAKE State ---
    const [mistakeTopic, setMistakeTopic] = useState("");
    const [mistakeData, setMistakeData] = useState<MistakeGameData | null>(null);
    const [mistakeLoading, setMistakeLoading] = useState(false);
    const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null);
    const [mistakeResult, setMistakeResult] = useState<'WIN' | 'LOSE' | 'TIMEOUT' | null>(null);
    const [mistakeQuestionIndex, setMistakeQuestionIndex] = useState(0);
    const [mistakeScore, setMistakeScore] = useState(0);
    const [mistakeTimeLeft, setMistakeTimeLeft] = useState(20);
    const [mistakeGameFinished, setMistakeGameFinished] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    const mistakeTimerRef = useRef<NodeJS.Timeout | null>(null);


    // --- SOUND EFFECTS (Synth) ---
    const playSound = (type: 'CORRECT' | 'WRONG' | 'TIMEOUT') => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'CORRECT') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'WRONG') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'TIMEOUT') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(200, now + 0.2);
                osc.frequency.linearRampToValueAtTime(100, now + 0.5);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            }
        } catch (e) {
            console.error("Audio Context Error", e);
        }
    };

    // --- Animation Loop for Visualizer ---
    const animate = () => {
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;

            // Map average (0-255) to scale (1.0 - 2.5)
            const scale = 1 + (average / 255) * 1.5;
            setVisualizerScale(scale);
        }
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleStartTeaching = async () => {
        setTranscript([]);
        setIsTeaching(true);
        tempUserTextRef.current = "";
        tempModelTextRef.current = "";
        lastSpeakerRef.current = null;

        try {
            const connection = await connectToStudentAI(
                (audioBuffer) => {
                    // Play Audio
                    if (outputContextRef.current) {
                        const ctx = outputContextRef.current;
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);

                        // Simple queueing logic
                        const currentTime = ctx.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;

                        sourcesRef.current.add(source);
                        source.onended = () => {
                            sourcesRef.current.delete(source);
                            // After audio finishes, allow user to speak again
                            if (isTeaching && !isRecording) {
                                // Auto-start recording for next user input
                                setTimeout(() => {
                                    if (startRecordingRef.current && isTeaching) {
                                        startRecordingRef.current();
                                        setIsRecording(true);
                                    }
                                }, 500);
                            }
                        };
                    }
                },
                (text, role, isTurnComplete) => {
                    // Determine if speaker switched
                    const currentSpeaker = role;

                    if (currentSpeaker === 'model' && lastSpeakerRef.current === 'user') {
                        // User finished speaking (Model started), flush user buffer
                        if (tempUserTextRef.current.trim()) {
                            setTranscript(prev => [...prev, { role: 'user', text: tempUserTextRef.current.trim() }]);
                            tempUserTextRef.current = "";
                        }
                    }

                    lastSpeakerRef.current = currentSpeaker;

                    if (role === 'user') {
                        tempUserTextRef.current += text;
                    } else {
                        tempModelTextRef.current += text;
                        // If model finishes turn, flush model buffer
                        if (isTurnComplete) {
                            if (tempModelTextRef.current.trim()) {
                                setTranscript(prev => [...prev, { role: 'model', text: tempModelTextRef.current.trim() }]);
                                tempModelTextRef.current = "";
                            }
                        }
                    }
                },
                () => {
                    handleStopTeaching();
                },
                "general_learning", // concept_id - you can make this configurable
                "beginner" // level
            );

            disconnectRef.current = connection.disconnect;
            analyserRef.current = connection.getAnalyser();
            outputContextRef.current = connection.getOutputContext();
            startRecordingRef.current = connection.startRecording;
            stopRecordingRef.current = connection.stopRecording;

            animate();

            // Start recording after a short delay
            setTimeout(() => {
                if (startRecordingRef.current && isTeaching) {
                    startRecordingRef.current();
                    setIsRecording(true);
                }
            }, 1000);

        } catch (e) {
            console.error("Failed to connect", e);
            setIsTeaching(false);
            alert("Failed to start teaching session. Please check microphone permissions.");
        }
    };

    const handleStopTeaching = () => {
        // Stop recording if active
        if (stopRecordingRef.current && isRecording) {
            stopRecordingRef.current();
            setIsRecording(false);
        }

        if (disconnectRef.current) {
            disconnectRef.current();
            disconnectRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Finalize any pending text in refs
        const userText = tempUserTextRef.current.trim();
        const modelText = tempModelTextRef.current.trim();

        setTranscript(prev => {
            const newTranscript = [...prev];
            if (userText) newTranscript.push({ role: 'user', text: userText });
            if (modelText) newTranscript.push({ role: 'model', text: modelText });
            return newTranscript;
        });

        tempUserTextRef.current = "";
        tempModelTextRef.current = "";
        lastSpeakerRef.current = null;

        setIsTeaching(false);
        setIsRecording(false);
        setVisualizerScale(1);

        // Stop audio
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        startRecordingRef.current = null;
        stopRecordingRef.current = null;
    };

    // Handle mic button click - toggle recording
    const handleMicClick = () => {
        if (!isTeaching) {
            handleStartTeaching();
        } else {
            if (isRecording && stopRecordingRef.current) {
                // Stop recording and process
                stopRecordingRef.current();
                setIsRecording(false);
            } else if (startRecordingRef.current) {
                // Start recording
                startRecordingRef.current();
                setIsRecording(true);
            }
        }
    };

    // --- DRAG GAME Handlers ---
    const handleStartDragGame = async () => {
        if (!dragTopic.trim() || dragLoading) return;
        setDragLoading(true);
        setDragData(null);
        setDroppedOption(null);
        setDragResult(null);
        setScore(0);
        setCurrentQuestionIndex(0);
        setIsGameFinished(false);

        const data = await generateDragDrop(dragTopic);
        if (data && data.questions.length > 0) {
            setDragData(data);
            startQuestionTimer();
        } else {
            // Handle error or no data
        }
        setDragLoading(false);
    };

    const startQuestionTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(20);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleTimeUp = () => {
        stopTimer();
        setDragResult('TIMEOUT');
        playSound('TIMEOUT');

        // Auto move to next after showing correct answer
        setTimeout(() => {
            moveToNextQuestion();
        }, 3000);
    };

    const moveToNextQuestion = () => {
        setDroppedOption(null);
        setDragResult(null);
        if (dragData && currentQuestionIndex < dragData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            startQuestionTimer();
        } else {
            setIsGameFinished(true);
            stopTimer();
        }
    };

    const resetDragGame = () => {
        stopTimer();
        setDragData(null);
        setDragTopic("");
        setDroppedOption(null);
        setDragResult(null);
        setScore(0);
        setCurrentQuestionIndex(0);
        setIsGameFinished(false);
    };

    const handleDragStart = (e: React.DragEvent, option: string) => {
        e.dataTransfer.setData("text/plain", option);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        // Prevent drops if result is already decided
        if (droppedOption || dragResult === 'TIMEOUT' || dragResult === 'INCORRECT') return;

        const option = e.dataTransfer.getData("text/plain");
        const currentQ = dragData?.questions[currentQuestionIndex];

        if (option && currentQ) {
            if (option === currentQ.correctAnswer) {
                setDroppedOption(option);
                setDragResult('CORRECT');
                setScore(s => s + 1);
                playSound('CORRECT');
                stopTimer();
                // Wait then next
                setTimeout(() => {
                    moveToNextQuestion();
                }, 1500);
            } else {
                setDragResult('INCORRECT');
                playSound('WRONG');
                stopTimer();
                setTimeout(() => {
                    moveToNextQuestion();
                }, 3000);
            }
        }
    };

    // --- MISTAKE GAME HANDLERS ---
    const handleStartMistakeGame = async () => {
        if (!mistakeTopic.trim() || mistakeLoading) return;
        setMistakeLoading(true);
        setMistakeData(null);
        setMistakeResult(null);
        setSelectedMistakeId(null);
        setMistakeScore(0);
        setMistakeQuestionIndex(0);
        setMistakeGameFinished(false);

        const data = await generateMistakeGame(mistakeTopic);
        if (data && data.rounds && data.rounds.length > 0) {
            setMistakeData(data);
            startMistakeTimer();
        }
        setMistakeLoading(false);
    };

    const startMistakeTimer = () => {
        if (mistakeTimerRef.current) clearInterval(mistakeTimerRef.current);
        setMistakeTimeLeft(20);
        mistakeTimerRef.current = setInterval(() => {
            setMistakeTimeLeft(prev => {
                if (prev <= 1) {
                    handleMistakeTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopMistakeTimer = () => {
        if (mistakeTimerRef.current) {
            clearInterval(mistakeTimerRef.current);
            mistakeTimerRef.current = null;
        }
    };

    const handleMistakeTimeUp = () => {
        stopMistakeTimer();
        setMistakeResult('TIMEOUT');
        playSound('TIMEOUT');
        setShowExplanation(false);

        // Wait then show explanation
        setTimeout(() => {
            setShowExplanation(true);
            // Then move
            setTimeout(() => {
                moveToNextMistakeRound();
            }, 4000);
        }, 1000);
    };

    const moveToNextMistakeRound = () => {
        setMistakeResult(null);
        setSelectedMistakeId(null);
        setShowExplanation(false);
        if (mistakeData && mistakeQuestionIndex < mistakeData.rounds.length - 1) {
            setMistakeQuestionIndex(prev => prev + 1);
            startMistakeTimer();
        } else {
            setMistakeGameFinished(true);
            stopMistakeTimer();
        }
    };

    const handleMistakeClick = (id: string) => {
        if (mistakeResult === 'WIN' || mistakeResult === 'TIMEOUT' || mistakeResult === 'LOSE') return; // Game over, can't click more

        const currentRound = mistakeData?.rounds[mistakeQuestionIndex];

        if (currentRound) {
            if (id === currentRound.errorId) {
                stopMistakeTimer();
                setMistakeResult('WIN');
                setSelectedMistakeId(id);
                setMistakeScore(s => s + 1);
                setShowExplanation(false);
                playSound('CORRECT');

                // Wait 2s then show explanation
                setTimeout(() => {
                    setShowExplanation(true);
                    // Then wait to read
                    setTimeout(() => {
                        moveToNextMistakeRound();
                    }, 4000);
                }, 1000);

            } else {
                stopMistakeTimer();
                setMistakeResult('LOSE');
                setSelectedMistakeId(id);
                setShowExplanation(false);
                playSound('WRONG');

                setTimeout(() => {
                    setShowExplanation(true);
                    setTimeout(() => {
                        moveToNextMistakeRound();
                    }, 4000);
                }, 1000);
            }
        }
    };

    const resetMistakeGame = () => {
        stopMistakeTimer();
        setMistakeData(null);
        setMistakeTopic("");
        setMistakeResult(null);
        setSelectedMistakeId(null);
        setShowExplanation(false);
        setMistakeScore(0);
        setMistakeQuestionIndex(0);
        setMistakeGameFinished(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStopTeaching();
            stopTimer();
            stopMistakeTimer();
        };
    }, []);


    const getGameTitle = () => {
        switch (activeGame) {
            case 'TEACH': return 'Teach AI';
            case 'MISTAKE': return 'Spot The Mistake';
            case 'DRAG': return 'Drag and Drop';
            default: return 'Game';
        }
    }

    // Helper to get current question safely
    const currentDragQuestion = dragData?.questions[currentQuestionIndex];
    const currentMistakeRound = mistakeData?.rounds[mistakeQuestionIndex];

    return (
        <div className="flex flex-col h-full bg-brand-black p-4 md:p-6 gap-4 overflow-hidden">

            {/* Header Logo */}
            <div className="shrink-0 flex items-center gap-2 pl-2">
                <span className="font-extrabold text-2xl tracking-tighter text-brand-neon shadow-neon-glow font-sans">
                    BLOOP PLAY
                </span>
            </div>

            {activeGame ? (
                /* --- VIEW: ACTIVE GAME INTERFACE --- */
                <div className="flex-1 border border-brand-neon rounded-[30px] p-4 md:p-6 relative flex flex-col overflow-hidden bg-[#0a0a0a] shadow-[0_0_20px_rgba(204,255,0,0.15)] group/container animate-fade-in">

                    {/* Header / Back Button */}
                    <div className="flex items-center justify-between mb-4 relative z-20 shrink-0">
                        <button
                            onClick={() => { setActiveGame(null); handleStopTeaching(); resetDragGame(); resetMistakeGame(); }}
                            className="flex items-center gap-2 text-zinc-500 hover:text-brand-neon transition-colors w-fit group/back"
                        >
                            <div className="p-1 rounded-full bg-zinc-900 border border-zinc-800 group-hover/back:border-brand-neon transition-colors">
                                <ArrowLeft size={14} />
                            </div>
                            <span className="text-xs font-mono uppercase tracking-widest">Return to Hub</span>
                        </button>

                        <div className="flex items-center gap-2 text-brand-neon/80 font-sans font-extrabold text-sm tracking-widest uppercase">
                            {getGameTitle()}
                        </div>
                    </div>

                    {activeGame === 'TEACH' ? (
                        /* --- TEACH AI INTERFACE --- */
                        <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">

                            {/* Main Interaction Area */}
                            <div
                                onClick={handleMicClick}
                                className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer"
                            >
                                {/* Background Animation Layer */}
                                <div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-neon/20 blur-[60px] transition-transform duration-100 ease-linear pointer-events-none"
                                    style={{ transform: `translate(-50%, -50%) scale(${visualizerScale})` }}
                                />
                                <div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-brand-neon/40 blur-[40px] transition-transform duration-75 ease-linear pointer-events-none"
                                    style={{ transform: `translate(-50%, -50%) scale(${visualizerScale * 0.8})` }}
                                />

                                {/* Button (Smaller) */}
                                <div className={`relative z-10 w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isTeaching ? 'bg-brand-neon border-brand-neon scale-110' : 'bg-black border-brand-neon hover:bg-brand-neon/10'}`}>
                                    {isTeaching ? (
                                        <Mic size={28} className="text-black animate-pulse" />
                                    ) : (
                                        <Mic size={28} className="text-brand-neon" />
                                    )}
                                </div>

                                <div className="mt-12 text-center relative z-10">
                                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-[0.2em] text-white mb-4">
                                        {isTeaching
                                            ? (isRecording ? "Listening..." : "Processing...")
                                            : "Start Session"}
                                    </h2>
                                    <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">
                                        {isTeaching
                                            ? (isRecording
                                                ? "Tap mic to stop and send"
                                                : "Tap mic to speak again")
                                            : "Tap mic to begin teaching"}
                                    </p>
                                </div>

                                {/* Tagline */}
                                <div className="absolute bottom-12 text-center opacity-50">
                                    <p className="text-brand-neon font-display font-bold text-lg">Where You Teach, AI Learns.</p>
                                </div>
                            </div>

                        </div>
                    ) : activeGame === 'DRAG' ? (
                        /* --- DRAG GAME INTERFACE --- */
                        <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full p-4 overflow-hidden">

                            {!dragData ? (
                                /* State 1: Input Topic */
                                <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in">
                                    <div className="text-center mb-4">
                                        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Topic Input</h2>
                                        <p className="text-zinc-500 text-sm">Enter a subject to generate a 10-round challenge.</p>
                                    </div>

                                    <div className="w-full relative">
                                        <input
                                            type="text"
                                            value={dragTopic}
                                            onChange={(e) => setDragTopic(e.target.value)}
                                            placeholder="e.g. Photosynthesis, Ancient Rome, Calculus..."
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-neon transition-colors placeholder-zinc-600"
                                            onKeyDown={(e) => e.key === 'Enter' && handleStartDragGame()}
                                        />
                                    </div>

                                    <button
                                        onClick={handleStartDragGame}
                                        disabled={dragLoading || !dragTopic.trim()}
                                        className="w-full py-4 bg-brand-neon text-black font-bold rounded-2xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                                    >
                                        {dragLoading ? (
                                            <><Loader2 size={20} className="animate-spin" /> Generating...</>
                                        ) : (
                                            "Generate Game"
                                        )}
                                    </button>
                                </div>
                            ) : isGameFinished ? (
                                /* State 3: Game Finished */
                                <div className="flex flex-col items-center justify-center animate-fade-in gap-6">
                                    <Trophy size={64} className="text-brand-neon" />
                                    <h2 className="text-4xl font-extrabold text-white">Game Complete</h2>
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Final Score</p>
                                        <p className="text-5xl font-mono text-brand-neon">{score} / {dragData.questions.length}</p>
                                    </div>
                                    <button
                                        onClick={resetDragGame}
                                        className="mt-4 px-8 py-3 bg-zinc-800 hover:bg-brand-neon hover:text-black rounded-full transition-all text-white font-bold tracking-widest uppercase flex items-center gap-2"
                                    >
                                        <RefreshCw size={18} /> Play Again
                                    </button>
                                </div>
                            ) : (
                                /* State 2: Game Board */
                                <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-slide-up h-full overflow-y-auto custom-scrollbar pb-10">

                                    {/* HUD: Score & Timer */}
                                    <div className="w-full flex justify-between items-center px-4 shrink-0">
                                        <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                            <Trophy size={16} className="text-brand-neon" />
                                            <span className="font-mono font-bold text-white text-sm">{score}</span>
                                        </div>
                                        <div className="text-zinc-500 font-mono text-xs tracking-widest">
                                            QUESTION {currentQuestionIndex + 1} / {dragData.questions.length}
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 ${timeLeft <= 5 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-zinc-900 text-zinc-300'}`}>
                                            <Timer size={16} />
                                            <span className="font-mono font-bold text-sm">{timeLeft}s</span>
                                        </div>
                                    </div>

                                    {/* Sentence Area */}
                                    <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative min-h-[200px] flex items-center justify-center flex-col gap-4 shrink-0">
                                        {dragResult === 'TIMEOUT' && (
                                            <div className="absolute top-2 right-4 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">Time Expired</div>
                                        )}
                                        {dragResult === 'INCORRECT' && (
                                            <div className="absolute top-2 right-4 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">Incorrect</div>
                                        )}
                                        <div className="text-xl md:text-3xl font-display font-medium leading-relaxed text-zinc-200">
                                            {currentDragQuestion?.sentence.split('_____').map((part, index, arr) => (
                                                <React.Fragment key={index}>
                                                    {part}
                                                    {index < arr.length - 1 && (
                                                        <span
                                                            onDragOver={handleDragOver}
                                                            onDrop={handleDrop}
                                                            className={`inline-flex items-center justify-center min-w-[120px] px-2 h-[40px] mx-2 align-middle rounded-xl border-2 border-dashed transition-all duration-300 relative top-[-2px]
                                                        ${droppedOption
                                                                    ? (dragResult === 'CORRECT'
                                                                        ? 'border-brand-neon bg-brand-neon/20 text-brand-neon'
                                                                        : 'border-red-500 bg-red-500/20 text-red-500')
                                                                    : (dragResult === 'TIMEOUT' || dragResult === 'INCORRECT')
                                                                        ? 'border-red-500 bg-red-500/10'
                                                                        : 'border-zinc-600 bg-zinc-800/50'
                                                                }
                                                    `}
                                                        >
                                                            {droppedOption ? (
                                                                <span className="font-bold px-2 truncate max-w-[150px]">{droppedOption}</span>
                                                            ) : dragResult === 'TIMEOUT' ? (
                                                                <span className="text-red-500 text-xs font-mono">MISSED</span>
                                                            ) : (
                                                                <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest pointer-events-none">Drop</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Correct Answer Display on Fail/Timeout */}
                                        {(dragResult === 'TIMEOUT' || dragResult === 'INCORRECT') && (
                                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl animate-fade-in text-left">
                                                <div className="mb-2">
                                                    <p className="text-xs text-red-500 uppercase tracking-widest mb-1">Correct Answer</p>
                                                    <p className="text-white font-bold text-lg">{currentDragQuestion?.correctAnswer}</p>
                                                </div>
                                                {currentDragQuestion?.explanation && (
                                                    <div>
                                                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Explanation</p>
                                                        <p className="text-zinc-300 text-sm leading-relaxed">{currentDragQuestion.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Options Area */}
                                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 shrink-0">
                                        {currentDragQuestion?.options.map((option, idx) => (
                                            <div
                                                key={idx}
                                                draggable={!droppedOption && dragResult !== 'TIMEOUT'}
                                                onDragStart={(e) => handleDragStart(e, option)}
                                                className={`px-6 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl cursor-grab active:cursor-grabbing hover:border-brand-neon/50 hover:bg-zinc-700 transition-all shadow-lg select-none text-base font-medium text-white
                                            ${(droppedOption || dragResult === 'TIMEOUT' || dragResult === 'INCORRECT') ? 'opacity-50 pointer-events-none grayscale' : ''}
                                        `}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            )}
                        </div>
                    ) : activeGame === 'MISTAKE' ? (
                        /* --- SPOT THE MISTAKE INTERFACE --- */
                        <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full p-4 overflow-hidden">

                            {!mistakeData ? (
                                /* State 1: Input Topic */
                                <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in">
                                    <div className="text-center mb-4">
                                        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Spot The Mistake</h2>
                                        <p className="text-zinc-500 text-sm">Enter a topic to generate 10 challenges.</p>
                                    </div>

                                    <div className="w-full relative">
                                        <input
                                            type="text"
                                            value={mistakeTopic}
                                            onChange={(e) => setMistakeTopic(e.target.value)}
                                            placeholder="e.g. Python Loops, Solar System, Baking..."
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-neon transition-colors placeholder-zinc-600"
                                            onKeyDown={(e) => e.key === 'Enter' && handleStartMistakeGame()}
                                        />
                                    </div>

                                    <button
                                        onClick={handleStartMistakeGame}
                                        disabled={mistakeLoading || !mistakeTopic.trim()}
                                        className="w-full py-4 bg-brand-neon text-black font-bold rounded-2xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                                    >
                                        {mistakeLoading ? (
                                            <><Loader2 size={20} className="animate-spin" /> Generating...</>
                                        ) : (
                                            "Create Challenge"
                                        )}
                                    </button>
                                </div>
                            ) : mistakeGameFinished ? (
                                /* State 3: Game Finished */
                                <div className="flex flex-col items-center justify-center animate-fade-in gap-6">
                                    <Trophy size={64} className="text-brand-neon" />
                                    <h2 className="text-4xl font-extrabold text-white">Game Complete</h2>
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Final Score</p>
                                        <p className="text-5xl font-mono text-brand-neon">{mistakeScore} / {mistakeData.rounds.length}</p>
                                    </div>
                                    <button
                                        onClick={resetMistakeGame}
                                        className="mt-4 px-8 py-3 bg-zinc-800 hover:bg-brand-neon hover:text-black rounded-full transition-all text-white font-bold tracking-widest uppercase flex items-center gap-2"
                                    >
                                        <RefreshCw size={18} /> Play Again
                                    </button>
                                </div>
                            ) : (
                                /* State 2: Game Board */
                                <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-slide-up h-full overflow-hidden">

                                    {/* HUD */}
                                    <div className="w-full flex justify-between items-center px-4 shrink-0">
                                        <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                            <Trophy size={16} className="text-brand-neon" />
                                            <span className="font-mono font-bold text-white text-sm">{mistakeScore}</span>
                                        </div>
                                        <div className="text-zinc-500 font-mono text-xs tracking-widest">
                                            ROUND {mistakeQuestionIndex + 1} / {mistakeData.rounds.length}
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 ${mistakeTimeLeft <= 5 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-zinc-900 text-zinc-300'}`}>
                                            <Timer size={16} />
                                            <span className="font-mono font-bold text-sm">{mistakeTimeLeft}s</span>
                                        </div>
                                    </div>

                                    <div className="text-center shrink-0">
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{currentMistakeRound?.title}</h3>
                                        <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Select the incorrect step</p>
                                    </div>

                                    {/* Scrollable Items List */}
                                    <div className="w-full grid gap-4 overflow-y-auto custom-scrollbar px-2 pb-20">
                                        {currentMistakeRound?.items.map((item) => {
                                            const isCorrectMistake = item.id === currentMistakeRound.errorId;
                                            const isSelected = selectedMistakeId === item.id;
                                            const showWin = mistakeResult === 'WIN';
                                            const showTimeout = mistakeResult === 'TIMEOUT';

                                            let bgClass = "bg-zinc-900 border-zinc-800 hover:border-zinc-600";

                                            if (showWin) {
                                                if (isCorrectMistake) {
                                                    bgClass = "bg-brand-neon/10 border-brand-neon shadow-[0_0_15px_rgba(204,255,0,0.2)]";
                                                } else {
                                                    bgClass = "bg-zinc-900/50 border-zinc-800 opacity-50";
                                                }
                                            } else if (showTimeout) {
                                                if (isCorrectMistake) {
                                                    bgClass = "bg-brand-neon/10 border-brand-neon shadow-[0_0_15px_rgba(204,255,0,0.2)] animate-pulse";
                                                } else {
                                                    bgClass = "bg-zinc-900/50 border-zinc-800 opacity-50";
                                                }
                                            } else if (mistakeResult === 'LOSE') {
                                                if (isCorrectMistake) {
                                                    bgClass = "bg-brand-neon/10 border-brand-neon shadow-[0_0_15px_rgba(204,255,0,0.2)]";
                                                } else if (isSelected) {
                                                    bgClass = "bg-red-500/10 border-red-500 text-red-500";
                                                } else {
                                                    bgClass = "bg-zinc-900/50 border-zinc-800 opacity-50";
                                                }
                                            }

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleMistakeClick(item.id)}
                                                    className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-start gap-4 ${bgClass}`}
                                                >
                                                    <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${(showWin || showTimeout) && isCorrectMistake ? 'border-brand-neon bg-brand-neon text-black' : 'border-zinc-700 text-zinc-700'
                                                        }`}>
                                                        {(showWin || showTimeout) && isCorrectMistake ? <Check size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                                    </div>
                                                    <p className={`text-base md:text-lg ${(showWin || showTimeout) && isCorrectMistake ? 'text-white font-medium' : 'text-zinc-300'}`}>
                                                        {item.text}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Feedback Area (Overlay) */}
                                    {(mistakeResult === 'WIN' || mistakeResult === 'TIMEOUT' || mistakeResult === 'LOSE') && showExplanation && (
                                        <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 border border-zinc-700 rounded-2xl p-6 animate-fade-in flex flex-col gap-2 backdrop-blur-md shadow-2xl z-20">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full text-black shrink-0 ${mistakeResult === 'WIN' ? 'bg-brand-neon' : 'bg-red-500'}`}>
                                                    {mistakeResult === 'WIN' ? <Check size={20} /> : <AlertCircle size={20} />}
                                                </div>
                                                <h4 className={`font-bold text-lg ${mistakeResult === 'WIN' ? 'text-brand-neon' : 'text-red-500'}`}>
                                                    {mistakeResult === 'WIN' ? 'Excellent Observation!' : (mistakeResult === 'TIMEOUT' ? 'Time Expired' : 'Incorrect Selection')}
                                                </h4>
                                            </div>
                                            <div className="mt-2 pl-12">
                                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Explanation</p>
                                                <p className="text-zinc-200 leading-relaxed text-sm md:text-base">{currentMistakeRound?.explanation}</p>

                                                <div className="mt-4 flex items-center gap-2 text-zinc-500 text-xs font-mono animate-pulse">
                                                    <Loader2 size={12} className="animate-spin" /> LOADING NEXT CHALLENGE...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    ) : (
                        /* --- PLACEHOLDER FOR OTHER GAMES --- */
                        <div className="flex-1 flex items-center justify-center opacity-30">
                            <p className="font-mono text-zinc-500">MODULE_LOADED</p>
                        </div>
                    )}

                </div>
            ) : (
                /* --- VIEW: HUB MENU --- */
                <div className="flex-1 flex items-center justify-center relative z-10 animate-fade-in">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl h-full md:h-auto aspect-auto md:aspect-[3/1]">

                        {/* Game 1: Teach AI */}
                        <div
                            onClick={() => setActiveGame('TEACH')}
                            className="group relative border border-brand-neon/30 hover:border-brand-neon bg-zinc-900/40 hover:bg-brand-neon/5 rounded-3xl p-8 cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-6 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.2)]"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-10 group-hover:opacity-20 transition-opacity" />

                            <div className="p-5 rounded-full bg-zinc-900 border border-zinc-700 group-hover:border-brand-neon group-hover:scale-110 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
                                <Mic size={40} className="text-zinc-400 group-hover:text-brand-neon transition-colors" />
                            </div>

                            <div className="text-center z-10">
                                <h3 className="text-2xl font-sans font-extrabold text-white mb-2 tracking-widest group-hover:text-brand-neon transition-colors">Teach AI</h3>
                                <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase">Where You Teach, AI Learns.</p>
                            </div>
                        </div>

                        {/* Game 2: Spot The Mistake (Formerly Echo Chamber) */}
                        <div
                            onClick={() => setActiveGame('MISTAKE')}
                            className="group relative border border-brand-neon/30 hover:border-brand-neon bg-zinc-900/40 hover:bg-brand-neon/5 rounded-3xl p-8 cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-6 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.2)]"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-10 group-hover:opacity-20 transition-opacity" />

                            <div className="p-5 rounded-full bg-zinc-900 border border-zinc-700 group-hover:border-brand-neon group-hover:scale-110 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
                                <Eye size={40} className="text-zinc-400 group-hover:text-brand-neon transition-colors" />
                            </div>
                            <div className="text-center z-10">
                                <h3 className="text-2xl font-sans font-extrabold text-white mb-2 tracking-widest group-hover:text-brand-neon transition-colors">Spot The Mistake</h3>
                                <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase">One Mistake. Can You See It?</p>
                            </div>
                        </div>

                        {/* Game 3: Drag and Drop */}
                        <div
                            onClick={() => setActiveGame('DRAG')}
                            className="group relative border border-brand-neon/30 hover:border-brand-neon bg-zinc-900/40 hover:bg-brand-neon/5 rounded-3xl p-8 cursor-pointer transition-all duration-500 flex flex-col items-center justify-center gap-6 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.2)]"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-10 group-hover:opacity-20 transition-opacity" />

                            <div className="p-5 rounded-full bg-zinc-900 border border-zinc-700 group-hover:border-brand-neon group-hover:scale-110 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
                                <Move size={40} className="text-zinc-400 group-hover:text-brand-neon transition-colors" />
                            </div>
                            <div className="text-center z-10">
                                <h3 className="text-2xl font-sans font-extrabold text-white mb-2 tracking-widest group-hover:text-brand-neon transition-colors">Drag and Drop</h3>
                                <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase">Create Without Friction</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default PlayModule;
