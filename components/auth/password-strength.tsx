'use client';

import { checkPasswordStrength, getPasswordStrengthColor, getPasswordStrengthText, type PasswordStrength } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
    password: string;
    className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
    if (!password) return null;

    const strength = checkPasswordStrength(password);
    const strengthText = getPasswordStrengthText(strength);
    const strengthColor = getPasswordStrengthColor(strength);

    const getStrengthPercentage = (strength: PasswordStrength): number => {
        switch (strength) {
            case 'weak':
                return 25;
            case 'fair':
                return 50;
            case 'good':
                return 75;
            case 'strong':
                return 100;
            default:
                return 0;
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Password strength</span>
                <span className={cn('font-medium', {
                    'text-red-400': strength === 'weak',
                    'text-orange-400': strength === 'fair',
                    'text-yellow-400': strength === 'good',
                    'text-green-400': strength === 'strong',
                })}>
                    {strengthText}
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                    className={cn('h-full transition-all duration-300', strengthColor)}
                    style={{ width: `${getStrengthPercentage(strength)}%` }}
                />
            </div>
        </div>
    );
}

