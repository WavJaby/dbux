import { logInternalError } from '@dbux/common/src/log/logger';
import Collection from './Collection';

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class StaticTraceCollection extends Collection {
  /**
   * @type {[]}
   */
  _staticTracesByProgram = [null];

  constructor() {
    super('staticTraces');
  }

  addEntries(programId, list) {
    // store static traces
    this._staticTracesByProgram[programId] = list;

    // console.warn(`staticTraceCollection.addEntries for #${programId} (${list.length})`);

    for (let i = 0; i < list.length; ++i) {
      const entry = list[i];

      // eslint-disable-next-line no-console
      console.assert(entry._traceId === i + 1);

      // global id over all programs
      entry.staticTraceId = this._all.length;
      // delete entry._traceId;
      
      this._all.push(entry);
    }

    // fix up callId + resultCallId, then send out
    for (let i2 = 0; i2 < list.length; ++i2) {
      const entry2 = list[i2];
      if (entry2._callId) {
        const calleeTrace = this.getTrace(programId, entry2._callId);
        entry2.callId = calleeTrace.staticTraceId;
        delete entry2._callId;
      }
      if (entry2._resultCallId) {
        const calleeTrace = this.getTrace(programId, entry2._resultCallId);
        entry2.resultCallId = calleeTrace.staticTraceId;
        delete entry2._resultCallId;
      }
    }

    // -> send out
    this._sendAll(list);
  }

  _getTraces(programId) {
    return this._staticTracesByProgram[programId];
  }

  getTrace(programId, inProgramStaticId) {
    const traces = this._getTraces(programId);
    if (!traces) {
      logInternalError("Invalid programId has no registered static traces:", programId);
      return null;
    }
    return traces[inProgramStaticId - 1];  // ids start at 1, array starts at 0
  }

  getStaticTraceId(programId, inProgramStaticId) {
    const staticTrace = this.getTrace(programId, inProgramStaticId);
    if (!staticTrace) {
      debugger;
      throw new Error(`Could not lookup staticTrace - programId=${programId}, inProgramStaticId=${inProgramStaticId} - allTraces:\n ${JSON.stringify(this._getTraces(programId))}`);
    }
    return staticTrace.staticTraceId;
  }
}

const staticTraceCollection = new StaticTraceCollection();
export default staticTraceCollection;