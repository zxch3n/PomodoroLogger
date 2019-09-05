
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
</p>



# Pomodoro Logger :clock930:


> **Invest your time easily**

[中文README](https://github.com/zxch3n/PomodoroLogger/wiki/中文README)


<img align="right" src="https://i.postimg.cc/0j8FJ70x/image.png" height="280"/>

- Use [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) to manage your time
- Collect and visualize your desktop working activities **locally**


# Data :chart_with_upwards_trend:

Pomodoro Logger records your desktop activities when you are in a working session of Pomodoro. 

It only records your application activities, including the name and title of the focused application, and low resolution (30 x 30) screenshot. You can disable monitor features in the settings.

You can export / delete all your data in the settings. 

All the data is saved and processed **locally**.

# Kanban Board

Pomodoro Logger has integrated [Kanban Board](https://en.wikipedia.org/wiki/Kanban_board) to help you organize and estimate the time spent of your todos easily. 

When creating a new todo card, you can set the estimated time spent. Pomodoro Logger will track the actual time spent for you by the **focused column** of Kanban Board. Every board has a focused column. When you finished a Pomodoro session of this board, this session will be connected to the cards of this focused column.

# Download

This project currently supports Windows and macOS.

To download, go to [release page](https://github.com/rem2016/PomodoroLogger/releases).


# Development

To build the project, issue

```
yarn

yarn build
```


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
