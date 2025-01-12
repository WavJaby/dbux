import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import ContextNode from './ContextNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RunNode');

class RunNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      runId,
    } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;

    // add GraphNode
    this.controllers.createComponent('GraphNode');

    // add root context
    const firstContext = dp.util.getFirstContextOfRun(runId);
    if (firstContext) {
      this.children.createComponent(ContextNode, {
        applicationId,
        context: firstContext
      });
      this.state.createdAt = dp.util.getRunCreatedAt(runId);
    }
    else {
      logError('Creating RunNode with no context');
    }

    const hiddenNodeManager = this.parent.controllers.getComponent('HiddenNodeManager');
    this.state.visible = hiddenNodeManager.shouldBeVisible(this);
    this.state.childrenAmount = this.contextChildrenAmount;
  }

  isHiddenBy() {
    return this.hiddenNodeManager.getHiddenNodeHidingThis(this);
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  get contextChildrenAmount() {
    const contextChildren = this.children.getComponents('ContextNode');
    let amount = contextChildren.length;
    contextChildren.forEach(childNode => amount += childNode.contextChildrenAmount);
    return amount;
  }

  // ###########################################################################
  // shared
  // ###########################################################################

  shared() {
    return {
      context: {
        runNode: this
      }
    };
  }
}

export default RunNode;