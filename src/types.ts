export type AnnotationLevel = 'notice' | 'warning' | 'failure';

export type Conclusion = 'success' | 'failure';

export type OutputAnnotations = {
    path: string;
    start_line: number;
    end_line: number;
    start_column?: number;
    end_column?: number;
    annotation_level: AnnotationLevel;
    title: string;
    message: string;
};
