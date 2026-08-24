"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@citybox/ui/atoms";
import { QuestionItem } from "./question-item";
import { QuestionFormModal } from "./question-form-modal";
import type { Question } from "../page-template-step-three.schema";

type QuestionBuilderProps = {
    questions: Question[];
    onQuestionsChange: (questions: Question[]) => void;
};

export function QuestionBuilder({
    questions,
    onQuestionsChange,
}: QuestionBuilderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(questions, oldIndex, newIndex);
            onQuestionsChange(reordered);
        }
    };

    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const handleEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setIsModalOpen(true);
    };

    const handleRemoveQuestion = (questionId: string) => {
        const isDefault = questionId === "field-name" || questionId === "field-phone";
        if (isDefault) return; // Não permitir remover campos padrão

        const newQuestions = questions.filter((q) => q.id !== questionId);
        onQuestionsChange(newQuestions);
    };

    const handleSaveQuestion = (question: Question) => {
        if (editingQuestion) {
            // Editar pergunta existente
            const newQuestions = questions.map((q) =>
                q.id === question.id ? question : q
            );
            onQuestionsChange(newQuestions);
        } else {
            // Adicionar nova pergunta
            onQuestionsChange([...questions, question]);
        }
        setIsModalOpen(false);
        setEditingQuestion(null);
    };

    // Separar perguntas padrão das customizadas
    const defaultQuestions = questions.filter(
        (q) => q.id === "field-name" || q.id === "field-phone"
    );
    const customQuestions = questions.filter(
        (q) => q.id !== "field-name" && q.id !== "field-phone"
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Arraste para reordenar. Os campos Nome e Telefone são obrigatórios.
                    </p>
                </div>
                <Button type="button" onClick={handleAddQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar pergunta
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {/* Perguntas padrão (sempre no topo) */}
                        {defaultQuestions.map((question) => (
                            <QuestionItem
                                key={question.id}
                                question={question}
                                isDefault={true}
                                onEdit={() => handleEditQuestion(question)}
                                onRemove={() => handleRemoveQuestion(question.id)}
                            />
                        ))}

                        {/* Perguntas customizadas */}
                        {customQuestions.map((question) => (
                            <QuestionItem
                                key={question.id}
                                question={question}
                                isDefault={false}
                                onEdit={() => handleEditQuestion(question)}
                                onRemove={() => handleRemoveQuestion(question.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <QuestionFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                question={editingQuestion}
                onSave={handleSaveQuestion}
            />
        </div>
    );
}
