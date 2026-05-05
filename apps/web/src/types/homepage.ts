export interface HomepageItem {
  slug: string;
  title: string;
  category: string;
  thumbnail?: string;
  previewUrl?: string;
  downloadUrl?: string;
  tags: string[];
}

export interface AiUiSource {
  id: string;
  title: string;
  category: string;
  tools: string[];
  difficulty: string;
  description: string;
  prompt?: string;
  previewUrl?: string;
  image?: string;
}
