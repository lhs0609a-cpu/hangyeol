import { beforeEach,describe,expect,it,vi } from 'vitest';
const mocked=vi.hoisted(()=>({context:vi.fn(),history:vi.fn(),needs:vi.fn(),save:vi.fn(),progress:vi.fn(),lesson:vi.fn(),view:vi.fn()}));
vi.mock('@hangyeol/core',async()=>{
  const {handle,readJson}=await import('../../../packages/core/src/http.js');
  const {apiError}=await import('../../../packages/core/src/errors.js');
  return {handle,readJson,apiError,requireStudentContext:mocked.context,observationHistory:mocked.history,recentTeachingNeeds:mocked.needs,saveTeachingObservation:mocked.save,recordAssetView:mocked.view,clientIp:()=>null,db:()=>({learningProgress:{findUnique:mocked.progress},lesson:{findFirst:mocked.lesson}})};
});
import {GET,POST} from '../app/api/students/[id]/classroom/route.js';
import {apiError} from '../../../packages/core/src/errors.js';
beforeEach(()=>{vi.clearAllMocks();mocked.context.mockResolvedValue({teacherId:1n,student:{id:2n}});mocked.history.mockResolvedValue([{id:'10',entries:[{evidence:'TEACHER_PRIVATE_NOTE'}]}]);mocked.needs.mockResolvedValue([]);mocked.progress.mockResolvedValue({notes:{'unit-15':'따뜻한 커피 주세요.','help-unit-15':'listening'}});mocked.lesson.mockResolvedValue(null);});
describe('classroom role separation',()=>{
  it('sends only student materials to the presentation window',async()=>{
    const response=await GET(new Request('http://localhost/api/students/2/classroom?unit=15&view=student'),{params:{id:'2'}});
    const data=await response.json();expect(response.status).toBe(200);expect(Object.keys(data)).toEqual(['book']);expect(data.book.unitNo).toBe(15);
    expect(mocked.history).not.toHaveBeenCalled();expect(mocked.progress).not.toHaveBeenCalled();expect(JSON.stringify(data)).not.toContain('TEACHER_PRIVATE_NOTE');
  });
  it('provides student work, self-reported needs and private probes to the teacher',async()=>{
    const data=await (await GET(new Request('http://localhost/api/students/2/classroom?unit=15'),{params:{id:'2'}})).json();
    expect(data.studentWork).toBe('따뜻한 커피 주세요.');expect(data.help).toEqual(['listening']);expect(data.guide.probes).toHaveLength(6);expect(data.history[0].entries[0].evidence).toBe('TEACHER_PRIVATE_NOTE');
  });
  it('rejects unauthorized reads and writes before touching private records',async()=>{
    mocked.context.mockRejectedValue(apiError('NOT_FOUND'));
    expect((await GET(new Request('http://localhost/api/students/2/classroom?unit=15'),{params:{id:'2'}})).status).toBe(404);
    expect((await POST(new Request('http://localhost/api/students/2/classroom',{method:'POST',body:'{}'}),{params:{id:'2'}})).status).toBe(404);
    expect(mocked.history).not.toHaveBeenCalled();expect(mocked.save).not.toHaveBeenCalled();
  });
});
