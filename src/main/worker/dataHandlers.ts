import { DataMerger } from '../../shared/dataMerger/dataMerger';
import { readAllData } from '../io/read';
import { WorkerMessage, WorkerMessageType, WorkerResponsePayload } from '../ipc/type';

type Response = WorkerResponsePayload[WorkerMessageType.MergeData];
export async function handleMergeData({
    payload: { external, source },
}: WorkerMessage<WorkerMessageType.MergeData>): Promise<Response> {
    if (typeof source === 'string') {
        source = await readAllData();
    }

    let warning = '';
    const merge = new DataMerger((s) => {
        warning += s + '\n';
    });
    const merged = merge.merge(source, external);
    const ans: Response = {
        merged,
    };
    if (warning) {
        ans.warning = warning;
    }

    return ans;
}
