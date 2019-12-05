
<p align="center">
  <img src="https://i.postimg.cc/hvjXfB94/icon.png" width="360"/>
</p>


<p align="center">
  <a href="https://circleci.com/gh/zxch3n/PomodoroLogger">
    <img src="https://circleci.com/gh/zxch3n/PomodoroLogger.svg?style=svg"/>
  </a>
  <a href="https://deepscan.io/dashboard#view=project&tid=5098&pid=6887&bid=60495">
    <img src="https://deepscan.io/api/teams/5098/projects/6887/branches/60495/badge/grade.svg"/>
  </a>
  <a href="https://codecov.io/gh/zxch3n/PomodoroLogger">
    <img src="https://codecov.io/gh/zxch3n/PomodoroLogger/branch/master/graph/badge.svg" />
  </a>
  <a href="https://github.com/zxch3n/PomodoroLogger/releases/latest">
    <img src="https://img.shields.io/github/downloads/zxch3n/PomodoroLogger/total" />
  </a>
</p>



# Pomodoro Logger :clock930:


> **Invest your time easily**

[中文README](https://github.com/zxch3n/PomodoroLogger/wiki/中文README)


<img align="right" src="https://i.postimg.cc/0j8FJ70x/image.png" height="280"/>

- Use [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) to manage your time
- Collect and visualize your desktop working activities, i.e., the names and titles of the using apps, **locally**
- Use integrated Kanban Board to make your schedule control easier
- Analyse your efficiency

## Pomodoro Technique :tomato:

The working loop in the Pomodoro Technique is split into a 25-minute focus session and a 5-minute rest session. During a work session, the user focuses on one todo item and should not do anything irrelevant. The Pomodoro Technique can greatly improve the efficiency of work and study and alleviate work fatigue.

In the Pomodoro Logger, the app will record the names and titles of the apps you use on your PC during the working sessions. The titles of apps contain rich semantic information. For example, the browser title includes the title of the website being viewed, and the IDE often provides the project path or project name.

- `Pomodoro Technique - Wikipedia - Google Chrome`
- `DeepMind (@DeepMindAI) | Twitter - Google Chrome`
- `pomodoro-logger [C:\code\pomodoro-logger] .\src\renderer\components\src\Application.tsx - WebStorm`


By connecting your todo items with the corresponding recorded Pomodoro sessions, you can analyze how often you are interrupted by email and social software, the time distribution of the application and application title used to complete the task. It will help you have a more comprehensive understanding of your working hours on PC.


## Efficiency Analysis

Pomodoro Logger keeps a list of distracting app (you can config it in the setting). When it detect your using distracting apps, you lose your efficiency.

It calculates user efficiency by [a heuristic method](./src/efficiency/efficiency.png).

Demonstrating your efficiency by the dots. The larger the hole, the less efficient you are.

<img width="150px" src="https://i.postimg.cc/Kzth8088/da.gif"/>

You can view the record in detail by clicking the circle

<p align="center">
    <img width="600px" src="https://i.postimg.cc/SKWhN9Vb/image.png"/>
</pa>


# Data :chart_with_upwards_trend:

Pomodoro Logger records your desktop activities when you are in a working session of Pomodoro. 

It only records your application activities, including the name and title of the focused application, and low resolution (30 x 30) screenshot. You can disable monitor features in the settings.

You can import / export / delete all your data in the settings. 

All the data is saved and processed **locally**.

# Kanban Board

Pomodoro Logger has integrated [Kanban Board](https://en.wikipedia.org/wiki/Kanban_board) to help you organize and estimate the time spent of your todos easily with confidence.

The lists in Kanban are divided into `Todo`, `In Progress`, and `Done`. Though lists customization is possible, you are required to preserve `In Progress` list and `Done` list in order to track, estimate and analyse your project time spent. You can set the estimated time cost on each todo card. Pomodoro Logger will assist you with the corresponding actual time spent record. i.e., When you are focusing on a Kanban board, it will automatically associate your Pomodoro session with the todo cards of `In Progress` list in the Kanban, which makes the further analysis possible.

To make the statistics more accurate, you can keep the cards of the `In Progress` list as few as possible to precisely reflect the tasks you are focusing on.


# Download

This project currently supports Windows and macOS.

To download, go to [release page](https://github.com/rem2016/PomodoroLogger/releases).


# Contribution

I'd love to see you're involved! Read [the Contribution Guide](./.github/CONTRIBUTION.md) for detail.

- The roadmap is shown on the [issue page](https://github.com/zxch3n/PomodoroLogger/issues)
- If you find a bug or want a new feature, [create a issue](https://github.com/zxch3n/PomodoroLogger/issues)
- If you want to start working on an issue, read [the Contribution Guide](./.github/CONTRIBUTION.md) and comment on the issue to let me know

# Screenshot


| **Pomodoro** |**Show Countdown in Tray**|
|:-|:-|
| <img src="https://i.postimg.cc/Fs87Gx0w/choose-Focuse.gif" width="256"/>|<img src="https://i.postimg.cc/LsMhF6CT/tray.png" width="256"/>|
|**Session Finished**|**Switch Mode**|
|<img src="https://i.postimg.cc/fT9wWQ0g/session-Finished.gif" height="256"/>|<img src="https://i.postimg.cc/DZp202gR/switch-Mode.gif" height="256"/>|

| **Kanban Board**| **Draggable Card** |
|:-| :- |
| <img src="https://i.postimg.cc/rs136CfV/Kanban-Board.png" height="256"/>|  <img src="https://i.postimg.cc/7Zrqft3P/moving-Around.gif" height="256"/>|
| **Estimate Your Time Spent**| **Search Your Cards**|
| <img src="https://i.postimg.cc/HxRzScHp/todo.png" height="256"/>|  <img src="https://i.postimg.cc/CLBKZf97/search-Card.gif" height="256"/>|

| **Visulization**|
|:-|
| <img src="https://i.postimg.cc/CKH5hT9V/vis.png" width="512"/>|
| <img src="https://i.postimg.cc/d150CRqH/vis1.png" width="512"/>|
  


# License


[GPL-3.0 License](./LICENSE)

Copyright © 2019 Zixuan Chen.
