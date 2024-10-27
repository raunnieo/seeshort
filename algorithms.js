// Algorithm implementations and related utility functions
class PathfindingAlgorithms {
  constructor(grid, weights) {
    this.grid = grid;
    this.weights = weights;
  }

  // Utility method to get neighbors of a cell
  getNeighbors(cell, rows, cols) {
    const [row, col] = [parseInt(cell.dataset.row), parseInt(cell.dataset.col)];
    const neighbors = [];

    if (row > 0) neighbors.push(this.grid[row - 1][col]);
    if (row < rows - 1) neighbors.push(this.grid[row + 1][col]);
    if (col > 0) neighbors.push(this.grid[row][col - 1]);
    if (col < cols - 1) neighbors.push(this.grid[row][col + 1]);

    return neighbors;
  }

  // Heuristic function for A* algorithm
  heuristic(cell1, cell2) {
    const [row1, col1] = [
      parseInt(cell1.dataset.row),
      parseInt(cell1.dataset.col),
    ];
    const [row2, col2] = [
      parseInt(cell2.dataset.row),
      parseInt(cell2.dataset.col),
    ];
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
  }

  // Helper method to get node with minimum distance
  getMinDistanceNode(queue, distances) {
    return queue.reduce((min, node) =>
      !min || distances.get(node) < distances.get(min) ? node : min
    );
  }

  // Helper method to get node with minimum f-score
  getMinFScoreNode(openSet, fScore) {
    return openSet.reduce((min, node) =>
      !min || fScore.get(node) < fScore.get(min) ? node : min
    );
  }

  // Dijkstra's Algorithm
  async dijkstra(startCell, endCell, rows, cols, updateVisitedCell, delay) {
    const queue = [startCell];
    const visited = new Set();
    const prev = new Map();
    const distances = new Map();

    distances.set(startCell, 0);

    while (queue.length > 0) {
      const current = this.getMinDistanceNode(queue, distances);
      queue.splice(queue.indexOf(current), 1);

      if (visited.has(current)) {
        continue; // Skip if already visited
      }

      visited.add(current);
      await updateVisitedCell(current, visited.size);

      if (current === endCell) {
        return { prev, visited };
      }

      const neighbors = this.getNeighbors(current, rows, cols);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && !neighbor.classList.contains("wall")) {
          const weight = this.weights.get(neighbor) || 1;
          const distance = distances.get(current) + weight;

          if (!distances.has(neighbor) || distance < distances.get(neighbor)) {
            distances.set(neighbor, distance);
            prev.set(neighbor, current);
            queue.push(neighbor);
            await delay();
          }
        }
      }
    }
    return null;
  }

  // A* Algorithm
  async astar(startCell, endCell, rows, cols, updateVisitedCell, delay) {
    const openSet = [startCell];
    const closedSet = new Set();
    const gScore = new Map();
    const fScore = new Map();
    const prev = new Map();

    gScore.set(startCell, 0);
    fScore.set(startCell, this.heuristic(startCell, endCell));

    while (openSet.length > 0) {
      const current = this.getMinFScoreNode(openSet, fScore);

      if (current === endCell) {
        return { prev, visited: closedSet };
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(current);
      await updateVisitedCell(current, closedSet.size);

      const neighbors = this.getNeighbors(current, rows, cols);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor) || neighbor.classList.contains("wall"))
          continue;

        const weight = this.weights.get(neighbor) || 1;
        const tentativeGScore = gScore.get(current) + weight;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= gScore.get(neighbor)) {
          continue;
        }

        prev.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(
          neighbor,
          gScore.get(neighbor) + this.heuristic(neighbor, endCell)
        );
        await delay();
      }
    }

    return null;
  }

  // Breadth-First Search
  async bfs(startCell, endCell, rows, cols, updateVisitedCell, delay) {
    const queue = [startCell];
    const visited = new Set([startCell]);
    const prev = new Map();

    while (queue.length > 0) {
      const current = queue.shift();

      if (current === endCell) {
        return { prev, visited };
      }

      const neighbors = this.getNeighbors(current, rows, cols);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && !neighbor.classList.contains("wall")) {
          visited.add(neighbor);
          prev.set(neighbor, current);
          queue.push(neighbor);
          await updateVisitedCell(neighbor, visited.size);
          await delay();
        }
      }
    }

    return null;
  }

  // Depth-First Search
  async dfs(startCell, endCell, rows, cols, updateVisitedCell, delay) {
    const stack = [startCell];
    const visited = new Set();
    const prev = new Map();

    while (stack.length > 0) {
      const current = stack.pop();

      if (!visited.has(current)) {
        visited.add(current);
        await updateVisitedCell(current, visited.size);

        if (current === endCell) {
          return { prev, visited };
        }

        const neighbors = this.getNeighbors(current, rows, cols);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && !neighbor.classList.contains("wall")) {
            prev.set(neighbor, current);
            stack.push(neighbor);
            await delay();
          }
        }
      }
    }

    return null;
  }
}

export default PathfindingAlgorithms;
