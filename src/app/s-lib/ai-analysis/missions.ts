import type { MissionModule } from "./types"
import * as landbankContext from './landbank/context'
import * as landbankRubric from './landbank/rubric'
import * as landbankSentiment from './landbank/sentiment'
import * as landbankProblems from './landbank/problems'
import * as landbankKeyPoints from './landbank/key_points'
import * as landbankHighlight from './landbank/highlights'

import * as srtChatRoleDetect from './srt/chat_role_detect'

import * as translatePrompt from './translate/simple'

import * as deltawwKeyPoints from './missions/deltaww/key_points'
import * as deltawwSentiment from './missions/deltaww/sentiment'
import * as deltawwContext from './missions/deltaww/context'
import * as deltawwRubric from './missions/deltaww/rubric'


import * as reportV1Sentiment from './missions/report-v1/sentiment'
import * as reportV1Context from './missions/report-v1/context'
import * as reportV1KeyPoints from './missions/report-v1/key_points'

export const missionModules: {[missionId:string]: MissionModule} = {
  'landbank/context': landbankContext,
  'landbank/sentiment': landbankSentiment,
  'landbank/key_points': landbankKeyPoints,
  'landbank/problems': landbankProblems,
  'landbank/highlights': landbankHighlight,
  'landbank/rubric': landbankRubric,

  'deltaww/key_points': deltawwKeyPoints,
  'deltaww/sentiment': deltawwSentiment,
  'deltaww/context': deltawwContext,
  'deltaww/rubric': deltawwRubric,

  'report-v1/sentiment': reportV1Sentiment,
  'report-v1/context': reportV1Context,
  'report-v1/key_points': reportV1KeyPoints,

  'srt/chat_role_detect': srtChatRoleDetect,

  'translate/simple': translatePrompt,
}