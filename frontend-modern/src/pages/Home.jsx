import { InputArea } from '../components/InputArea';

const promptExamples = [
    'Solve for x: 2x + 5 = 13',
    'Explain the Pythagorean theorem',
    'What is a derivative?',
    'Help me with fractions',
    'Factor x^2 + 5x + 6',
];

export function Home({ onStart }) {
    const handleSend = () => {
        onStart();
    };

    return (
        <div class="welcome-section">
            <div class="welcome-heading">
                <h1 class="welcome-title">MathTutor AI</h1>
                <p class="welcome-subtitle">
                    Your personal math tutor. Ask any question and get step-by-step explanations.
                </p>
            </div>
            <div class="welcome-input-wrapper">
                <div class="welcome-input-card">
                    <InputArea onSend={handleSend} isLoading={false} />
                </div>
                <div class="prompt-buttons">
                    {promptExamples.map((prompt, i) => (
                        <button
                            key={i}
                            class={i === 0 ? 'prompt-btn prompt-btn-accent' : 'prompt-btn'}
                            onClick={() => {
                                onStart();
                            }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
