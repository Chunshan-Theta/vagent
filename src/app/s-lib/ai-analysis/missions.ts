import type { MissionModule } from "./types"
import * as landbankContext from './landbank/context'
import * as landbankRubric from './landbank/rubric'
import * as landbankSentiment from './landbank/sentiment'
import * as landbankProblems from './landbank/problems'
import * as landbankKeyPoints from './landbank/key_points'
import * as landbankHighlight from './landbank/highlights'


export const missionModules: {[missionId:string]: MissionModule} = {
  'landbank/context': landbankContext,
  'landbank/sentiment': landbankSentiment,
  'landbank/key_points': landbankKeyPoints,
  'landbank/problems': landbankProblems,
  'landbank/highlights': landbankHighlight,
  'landbank/rubric': landbankRubric,
}