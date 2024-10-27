import PathfindingAlgorithms from "./algorithms.js";

class PathfindingVisualizer {
  constructor() {
    this.grid = [];
    this.startCell = null;
    this.endCell = null;
    this.isRunning = false;
    this.startTime = 0;
    this.animationSpeed = 50;
    this.isDarkTheme = true;
    this.currentAlgorithm = "dijkstra";
    this.rows = 20;
    this.cols = 20;
    this.weights = new Map();
    this.savedConfigs = new Map();
  }

  initialize() {
    this.createGrid();
    this.algorithms = new PathfindingAlgorithms(this.grid, this.weights);
    this.initializeControls();
    this.updateGridStyle();
  }

  updateGridStyle() {
    const gridElement = document.getElementById("grid");
    if (!gridElement) return;

    const maxGridSize = 800;
    const minCellSize = 15;
    const cellSize = Math.max(
      minCellSize,
      Math.min(
        Math.floor(maxGridSize / Math.max(this.rows, this.cols)),
        maxGridSize / Math.min(this.rows, this.cols)
      )
    );

    const totalWidth = cellSize * this.cols;
    const totalHeight = cellSize * this.rows;

    gridElement.style.width = `${totalWidth}px`;
    gridElement.style.height = `${totalHeight}px`;
    gridElement.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize}px)`;
    gridElement.style.gridTemplateRows = `repeat(${this.rows}, ${cellSize}px)`;
  }

  initializeControls() {
    // Algorithm selector
    const algorithmButtons = document.querySelectorAll(
      ".algorithm-buttons button"
    );
    algorithmButtons.forEach((button) => {
      button.addEventListener("click", () => {
        algorithmButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        this.currentAlgorithm = button.dataset.algorithm;
      });
    });

    const speedControl = document.getElementById("speedControl");
    speedControl.addEventListener("input", (e) => {
      this.animationSpeed = parseInt(e.target.value);
    });

    // Solve button
    const solveButton = document.getElementById("solveButton");
    solveButton.addEventListener("click", () => this.solve());

    // Reset button
    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener("click", () => this.resetGrid());

    // Theme toggle
    const themeButton = document.getElementById("themeButton");
    themeButton.addEventListener("click", () => this.toggleTheme());

    // Generate Maze button
    const mazeButton = document.getElementById("mazeButton");
    mazeButton.addEventListener("click", () => this.generateMaze());

    // Save/Load buttons
    const saveButton = document.getElementById("saveButton");
    saveButton.addEventListener("click", () => {
      const name = prompt("Enter configuration name:");
      if (name) this.saveConfiguration(name);
    });

    const loadButton = document.getElementById("loadButton");
    loadButton.addEventListener("click", () => {
      const name = prompt("Enter configuration name to load:");
      if (name) this.loadConfiguration(name);
    });
  }

  createGrid() {
    const gridElement = document.getElementById("grid");
    if (!gridElement) return;

    gridElement.innerHTML = "";
    this.grid = [];

    for (let i = 0; i < this.rows; i++) {
      const row = [];
      for (let j = 0; j < this.cols; j++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = i;
        cell.dataset.col = j;

        // Mouse events for wall drawing
        let isMouseDown = false;
        let isStartDrag = false;
        let isEndDrag = false;

        cell.addEventListener("mousedown", (e) => {
          e.preventDefault();
          isMouseDown = true;
          if (cell === this.startCell) {
            isStartDrag = true;
          } else if (cell === this.endCell) {
            isEndDrag = true;
          } else {
            this.handleCellClick(e);
          }
        });

        cell.addEventListener("mouseover", (e) => {
          if (!isMouseDown) return;
          if (isStartDrag || isEndDrag) {
            const target = e.target;
            if (
              !target.classList.contains("wall") &&
              !target.classList.contains("end") &&
              !target.classList.contains("start")
            ) {
              if (isStartDrag) {
                this.startCell.classList.remove("start");
                target.classList.add("start");
                this.startCell = target;
              } else {
                this.endCell.classList.remove("end");
                target.classList.add("end");
                this.endCell = target;
              }
            }
          } else {
            this.handleCellClick(e);
          }
        });

        cell.addEventListener("mouseup", () => {
          isMouseDown = false;
          isStartDrag = false;
          isEndDrag = false;
        });

        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.handleWeightAssignment(cell);
        });

        gridElement.appendChild(cell);
        row.push(cell);
      }
      this.grid.push(row);
    }

    // Add global mouseup event
    document.addEventListener("mouseup", () => {
      isMouseDown = false;
      isStartDrag = false;
      isEndDrag = false;
    });
  }

  handleCellClick(event) {
    if (this.isRunning) return;

    const cell = event.target;
    if (!cell.classList.contains("cell")) return;

    if (
      !this.startCell &&
      !cell.classList.contains("wall") &&
      !cell.classList.contains("end")
    ) {
      this.startCell = cell;
      cell.classList.add("start");
    } else if (
      !this.endCell &&
      !cell.classList.contains("wall") &&
      !cell.classList.contains("start")
    ) {
      this.endCell = cell;
      cell.classList.add("end");
    } else if (
      !cell.classList.contains("start") &&
      !cell.classList.contains("end")
    ) {
      cell.classList.toggle("wall");
    }
  }

  handleWeightAssignment(cell) {
    if (this.isRunning) return;
    if (cell.classList.contains("start") || cell.classList.contains("end"))
      return;

    const weight = prompt("Enter weight (1-9):", "1");
    if (weight && !isNaN(weight) && weight >= 1 && weight <= 9) {
      this.weights.set(cell, parseInt(weight));
      cell.textContent = weight;
      cell.classList.add("weighted");
      cell.classList.remove("wall");
    }
  }

  async solve() {
    if (!this.startCell || !this.endCell || this.isRunning) return;

    this.isRunning = true;
    this.resetVisitedAndPath();
    this.startTime = performance.now();

    const updateVisitedCell = async (cell, visitedCount) => {
      if (cell !== this.startCell && cell !== this.endCell) {
        cell.classList.add("visited");
      }
      document.getElementById("visitedCount").textContent = visitedCount;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(1, 100 - this.animationSpeed))
      );
    };

    const delay = () =>
      new Promise((resolve) =>
        setTimeout(resolve, Math.max(1, 100 - this.animationSpeed))
      );

    let result;
    switch (this.currentAlgorithm) {
      case "astar":
        result = await this.algorithms.astar(
          this.startCell,
          this.endCell,
          this.rows,
          this.cols,
          updateVisitedCell,
          delay
        );
        break;
      case "bfs":
        result = await this.algorithms.bfs(
          this.startCell,
          this.endCell,
          this.rows,
          this.cols,
          updateVisitedCell,
          delay
        );
        break;
      case "dfs":
        result = await this.algorithms.dfs(
          this.startCell,
          this.endCell,
          this.rows,
          this.cols,
          updateVisitedCell,
          delay
        );
        break;
      default:
        result = await this.algorithms.dijkstra(
          this.startCell,
          this.endCell,
          this.rows,
          this.cols,
          updateVisitedCell,
          delay
        );
    }

    if (result) {
      await this.reconstructPath(result.prev);
    } else {
      alert("No path found!");
    }

    this.isRunning = false;
  }

  async reconstructPath(prev) {
    let current = this.endCell;
    let pathLength = 0;

    while (prev.has(current)) {
      current = prev.get(current);
      if (current !== this.startCell) {
        current.classList.add("path");
        pathLength++;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(1, 100 - this.animationSpeed))
        );
      }
    }

    document.getElementById("pathLength").textContent = pathLength;
    const endTime = performance.now();
    document.getElementById("time").textContent = Math.round(
      endTime - this.startTime
    );
  }

  generateMaze() {
    if (this.isRunning) return;
    this.resetGrid();

    const addWalls = (startRow, startCol, height, width, orientation) => {
      if (height <= 2 || width <= 2) return;

      const horizontal = orientation === "horizontal";
      const wallRow = startRow + (horizontal ? Math.floor(height / 2) : 0);
      const wallCol = startCol + (horizontal ? 0 : Math.floor(width / 2));
      const passageRow =
        wallRow + (horizontal ? 0 : Math.floor(Math.random() * height));
      const passageCol =
        wallCol + (horizontal ? Math.floor(Math.random() * width) : 0);

      if (horizontal) {
        for (let col = startCol; col < startCol + width; col++) {
          if (col !== passageCol) {
            this.grid[wallRow][col].classList.add("wall");
          }
        }
      } else {
        for (let row = startRow; row < startRow + height; row++) {
          if (row !== passageRow) {
            this.grid[row][wallCol].classList.add("wall");
          }
        }
      }

      const nextOrientation = horizontal ? "vertical" : "horizontal";

      if (horizontal) {
        addWalls(
          startRow,
          startCol,
          Math.floor(height / 2),
          width,
          nextOrientation
        );
        addWalls(
          wallRow + 1,
          startCol,
          height - Math.floor(height / 2) - 1,
          width,
          nextOrientation
        );
      } else {
        addWalls(
          startRow,
          startCol,
          height,
          Math.floor(width / 2),
          nextOrientation
        );
        addWalls(
          startRow,
          wallCol + 1,
          height,
          width - Math.floor(width / 2) - 1,
          nextOrientation
        );
      }
    };

    addWalls(
      0,
      0,
      this.rows,
      this.cols,
      Math.random() < 0.5 ? "horizontal" : "vertical"
    );
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle("light-theme");
  }

  resetVisitedAndPath() {
    for (const row of this.grid) {
      for (const cell of row) {
        cell.classList.remove("visited", "path");
      }
    }
    document.getElementById("visitedCount").textContent = "0";
    document.getElementById("pathLength").textContent = "0";
    document.getElementById("time").textContent = "0";
  }

  resetGrid() {
    if (this.isRunning) return;

    for (const row of this.grid) {
      for (const cell of row) {
        cell.className = "cell";
        cell.textContent = "";
      }
    }
    this.startCell = null;
    this.endCell = null;
    this.weights.clear();
    this.resetVisitedAndPath();
  }

  saveConfiguration(name) {
    const config = {
      grid: Array.from(this.grid).map((row) =>
        Array.from(row).map((cell) => ({
          isWall: cell.classList.contains("wall"),
          isStart: cell.classList.contains("start"),
          isEnd: cell.classList.contains("end"),
          weight: this.weights.get(cell) || 1,
        }))
      ),
      rows: this.rows,
      cols: this.cols,
    };

    this.savedConfigs.set(name, config);
    localStorage.setItem(
      "pathfindingConfigs",
      JSON.stringify(Array.from(this.savedConfigs.entries()))
    );
  }

  loadConfiguration(name) {
    const config = this.savedConfigs.get(name);
    if (!config) {
      alert("Configuration not found!");
      return;
    }

    if (config.rows !== this.rows || config.cols !== this.cols) {
      this.rows = config.rows;
      this.cols = config.cols;
      this.createGrid();
    } else {
      this.resetGrid();
    }

    config.grid.forEach((row, i) => {
      row.forEach((cellConfig, j) => {
        const cell = this.grid[i][j];
        if (cellConfig.isWall) cell.classList.add("wall");
        if (cellConfig.isStart) {
          cell.classList.add("start");
          this.startCell = cell;
        }
        if (cellConfig.isEnd) {
          cell.classList.add("end");
          this.endCell = cell;
        }
        if (cellConfig.weight > 1) {
          this.weights.set(cell, cellConfig.weight);
          cell.textContent = cellConfig.weight;
          cell.classList.add("weighted");
        }
      });
    });
  }
}

// Initialize the pathfinding visualizer when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const visualizer = new PathfindingVisualizer();
  visualizer.initialize();

  // Load saved configurations from localStorage
  const savedConfigs = localStorage.getItem("pathfindingConfigs");
  if (savedConfigs) {
    visualizer.savedConfigs = new Map(JSON.parse(savedConfigs));
  }
});
