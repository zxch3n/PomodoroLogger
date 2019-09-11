import { createAction } from 'deox';


const nextStory = createAction(
    '[Guide]NEXT_STORY'
);

const preStory = createAction(
    '[Guide]PRE_STORY'
);

const quit = createAction(
    '[Guide]QUIT'
);

const startNewGuide = createAction(
    '[Guide]START'
);

const getHelpByStoryName = createAction(
    '[Guide]HELP_BY_NAME',
    resolve => (name: string) => resolve({name})
);

export const actions = {
    nextStory,
    preStory,
    quit,
    startNewGuide,
    getHelpByStoryName
};


