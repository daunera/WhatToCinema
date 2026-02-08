"use client";

import React, { useState, useEffect } from "react";
import { verifyPasscode, checkAuth } from "@/app/actions/auth";
import { useTranslation } from "@/components/I18nProvider";

interface PasscodeGateProps {
    children: React.ReactNode;
}

export default function PasscodeGate({ children }: PasscodeGateProps) {
    const { dict } = useTranslation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            const auth = await checkAuth();
            setIsAuthenticated(auth);
        };
        initAuth();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await verifyPasscode(passcode);
            if (result.success) {
                setIsAuthenticated(true);
            } else {
                setError(result.error || dict.auth.passwordError);
            }
        } catch (err) {
            setError(dict.auth.genericError);
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">{dict.auth.loading}</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <div className="w-full max-w-md p-8 rounded-2xl border border-border glass shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {dict.metadata.title}
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder={dict.auth.passwordPlaceholder}
                                autoFocus
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-xl tracking-[0.5em] transition-all"
                                disabled={isLoading}
                            />
                            {error && (
                                <p className="text-destructive text-sm text-center font-medium animate-shake">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !passcode}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                dict.auth.submit
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
