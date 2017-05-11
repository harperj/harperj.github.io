class TreeMenuController {
  constructor($compile, $location) {
    this.$compile = $compile;
    this.$location = $location;

    this.isRoot = (this.nodeType === 'root');
    this.hideChildren = !this.isRoot;
    this.patchInputTreeData();
  }

  patchInputTreeData() {
    // The root node doesn't have its own object, so we will create it.
    if (this.isRoot) {
      this.url = '/';
      this.treeData.title = 'Portfolio';
    }
    // Otherwise, we'll set up the node's children based on its subLevel.
    else {
      this.url = '/' + this.treeData.sub_level + '/' + this.treeData.id;

      // If there are no children (circuit case) we know it's a leaf
      if (!this.treeData.children) this.isLeaf = true;
    }
  }

  toggleHideChildren() {
    this.hideChildren = !this.hideChildren;
  }

  getSelected() {
    if (this.selectedSub.subLevel === 'portfolio' && this.treeData.sub_level === 'portfolio') {
      return true;
    }
    return this.selectedSub.subId === this.treeData.id && angular.isDefined(this.treeData.id);
  }

  select() {
    this.selectedSub.subLevel = this.treeData.sub_level;
    this.selectedSub.subId = this.treeData.id;
  }

  ensureOpen() {
    let nextParentNode = this.parent;
    while (nextParentNode) {
      nextParentNode.hideChildren = false;
      nextParentNode = nextParentNode.parent;
    }
  }

  /**
   * Truncates a string to a constant length (+ trailing chars) to keep it from wrapping in menu.
   * @param string to be truncated
   */
  truncateLabel(string) {
    if (!string) return string;

    const MAX_LEN = 30;
    const TRUNC_CHARS = '...';
    let end = Math.min(string.length, MAX_LEN);
    let truncated = string.slice(0, end);

    if (string.length > MAX_LEN) {
      truncated += TRUNC_CHARS;
    }

    return truncated;
  }
}

TreeMenuController.$inject = ['$compile', '$location'];

export class TreeMenuDirective {
  constructor() {
    this.templateUrl = '/partials/treeMenuLabel.html';
    this.restrict = 'A';
    this.controller = TreeMenuController;
    this.controllerAs = 'treeMenuCtrl';
    this.bindToController = {
      'treeData':    '=',
      'nodeType':    '@',
      'selectedSub': '=',
      'parent':      '='
    };
    this.scope = {};
  }

  link($scope, $el, $attrs, treeMenuCtrl) {
    var render = function render() {
      if (angular.isArray(treeMenuCtrl.treeData.children) && treeMenuCtrl.treeData.children.length > 0) {
        // Remove contents which are text nodes or comments
        var isTextOrComment = (node) => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE;
        $el.contents()
          .filter(function() { return isTextOrComment(this); })
          .remove();

        if (!treeMenuCtrl.hideChildren) {
          renderChildren();
        }
      }
    };

    var removeChildren = function removeChildren() {
      // Remove existing sub-trees
      let treeItem = $el.children('li');
      treeItem.contents('ul').remove();
    };

    var renderChildren = function renderChildren() {
      // Remove existing sub-trees
      removeChildren();
      let treeItem = $el.children('li');

      let childTemplate = `
        <ul ng-show="!treeMenuCtrl.hideChildren"
            ng-repeat="child in treeMenuCtrl.treeData.children"
            tree-menu
            selected-sub="treeMenuCtrl.selectedSub"
            node-type="node"
            tree-data="child"
            parent="treeMenuCtrl"></ul>
      `;
      treeItem.append(treeMenuCtrl.$compile(childTemplate)($scope));
    };

    $scope.$watch('treeMenuCtrl.hideChildren', () => {
      if (treeMenuCtrl.hideChildren) {
        removeChildren();
      }
      else {
        removeChildren();
        renderChildren();
      }
    });

    $scope.$watch('treeMenuCtrl.treeData', () => {
      // Data might not have been patched yet, so make sure we do so
      treeMenuCtrl.patchInputTreeData();
      render();
    }, true);

    $scope.$watch('treeMenuCtrl.selectedSub', () => {
      // When selected sub changes, ensure that we're open to the correct level
      if (treeMenuCtrl.getSelected()) {
        treeMenuCtrl.ensureOpen();
        renderChildren();
      }
    }, true);
  }

  static factory() {
    return new TreeMenuDirective();
  }
}
