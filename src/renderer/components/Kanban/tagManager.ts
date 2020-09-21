export interface Path {
    boardId: string;
    listId: string;
    cardId: string;
}

export class TagManager {
    private tags: Map<string, Set<string>> = new Map<string, Set<string>>();
    private sortedTags?: string[];

    getSortedTag = () => {
        if (!this.sortedTags) {
            const tags: [string, number][] = [];
            this.tags.forEach((value, key) => {
                tags.push([key, value.size]);
            });

            tags.sort((a, b) => -a[1] + b[1]);
            this.sortedTags = tags.map((x) => x[0]);
        }

        return this.sortedTags;
    };

    getTagCount(tag: string) {
        return this.tags.get(tag)?.size ?? 0;
    }

    push(tag: string, path: Path) {
        this.sortedTags = undefined;
        if (!this.tags.has(tag)) {
            this.tags.set(tag, new Set<string>());
        }

        this.tags.get(tag)!.add(this.hashPath(path));
    }

    hashPath({ boardId, listId, cardId }: Path) {
        return `${boardId}/${listId}/${cardId}`;
    }
}
