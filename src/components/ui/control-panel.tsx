export default function ControlPanel() {

    return (
        <div className="mt-10 rounded-lg border border-border bg-card p-6 text-card-foreground">
            <h2 className="text-2xl underline">
                Control Panel
            </h2>
            <div className="mt-5 space-y-3">
                <p>
                    DB Status:
                    <span className="ml-2 text-green-600">
                        Connected
                    </span>
                </p>
                <p>
                    Available LLMs:
                    GPT-4, Claude, Gemini
                </p>
            </div>
        </div>
    )

}