import { createAction, createReducer } from 'deox';
import { Story } from './type';
import { timerStories, kanbanStories, allStories } from './stories';

export interface StoryState {
    stories: { [name: string]: Story[] };
    index: number;
    name?: string;
}

const defaultState: StoryState = {
    stories: {
        timerStories,
        kanbanStories,
        allStories
    },
    index: 0
};

const nextStory = createAction('[Guide]NEXT_STORY');

const preStory = createAction('[Guide]PRE_STORY');

const quit = createAction('[Guide]QUIT');

const startHelpByStoryName = createAction(
    '[Guide]HELP_BY_NAME',
    resolve => (name: string = 'all') => resolve({ name })
);

export const actions = {
    nextStory,
    preStory,
    quit,
    startHelpByStoryName
};

export const storyReducer = createReducer(defaultState, handle => [
    handle(nextStory, state => {
        if (state.name == null) {
            return state;
        }

        if (state.index + 1 >= state.stories[state.name].length) {
            return {
                stories: state.stories,
                index: 0
            };
        }
        return {
            ...state,
            index: state.index + 1
        };
    }),
    handle(preStory, state => {
        if (state.index - 1 < 0) {
            return {
                stories: state.stories,
                index: 0
            };
        }
        return {
            ...state,
            index: state.index - 1
        };
    }),
    handle(quit, state => ({
        ...state,
        name: undefined
    })),
    handle(startHelpByStoryName, (state, { payload: { name } }) => ({
        ...state,
        name,
        index: 0
    }))
]);
