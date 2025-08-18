# Port of the original Tsukihime story to React

Find how to start the project on your computer in [README.md](https://github.com/requinDr/tsukiweb-public/blob/main/README.md)  
We welcome all contributions.

## Guidelines
1) Data are stored on the user's device and are not to be collected in any way.
2) Remake assets are not to be used.
3) Everything should be done with accessibility in mind.
4) The GUI should be updated to look and feel more modern.
5) The game should be fully responsive.
6) Everything should be simple and easy to use for the average player.
7) The main browsers must be supported (Chromium-based browsers, Firefox, Safari) within the last 2 to 3 years updates.
8) Every action done with a mouse should have an equivalent for touch screens.
9) Actions shortcut can be changed to reflect common VNs shortcuts.

## Code
- The game original assets have been separated from the repo and shouldn't be commited to it.
- `tsukiweb-common` should be used for any shared code or assets with future projects. No dependency outside of it or npm modules should be imported in it.