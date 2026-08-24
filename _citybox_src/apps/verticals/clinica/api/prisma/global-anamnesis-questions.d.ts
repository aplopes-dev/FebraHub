import type { AnamnesisAlertTrigger, AnamnesisQuestionScope, AnamnesisQuestionType } from '../generated/prisma/client';
export type GlobalAnamnesisQuestionSeed = {
    mockId: string;
    id: string;
    text: string;
    type: AnamnesisQuestionType;
    scope: AnamnesisQuestionScope;
    auxiliaryText?: string;
    generatesAlert?: boolean;
    alertWhen?: AnamnesisAlertTrigger;
    alertName?: string;
};
export declare function globalQuestionUuid(index: number): string;
export declare const MOCK_QUESTION_ID_TO_UUID: Record<string, string>;
export declare const GLOBAL_ANAMNESIS_QUESTIONS: GlobalAnamnesisQuestionSeed[];
