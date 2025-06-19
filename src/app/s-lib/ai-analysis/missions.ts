import type { MissionModule } from "./types"
import * as landbankContext from './missions/landbank/context'
import * as landbankRubric from './missions/landbank/rubric'
import * as landbankSentiment from './missions/landbank/sentiment'
import * as landbankProblems from './missions/landbank/problems'
import * as landbankKeyPoints from './missions/landbank/key_points'
import * as landbankHighlight from './missions/landbank/highlights'

import * as srtChatRoleDetect from './srt/chat_role_detect'

import * as translatePrompt from './translate/simple'

import * as deltawwKeyPoints from './missions/deltaww/key_points'
import * as deltawwSentiment from './missions/deltaww/sentiment'
import * as deltawwContext from './missions/deltaww/context'
import * as deltawwRubric from './missions/deltaww/rubric'


import * as reportV1Sentiment from './missions/report-v1/sentiment'
import * as reportV1Context from './missions/report-v1/context'
import * as reportV1KeyPoints from './missions/report-v1/key_points'
import * as reportV1KeyPointsV2 from './missions/report-v1/key_points_v2'
import * as reportV1Reference from './missions/report-v1/reference'

import * as landbankDA1Grading from './missions/landbank-d/a1-grading'
import * as landbankDA4Advice from './missions/landbank-d/a4-advice'

import * as analysisA1GradingFull from './missions/analysis/a1-grading-full'
import * as analysisA4AdviceFull from './missions/analysis/a4-advice-full'

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
  'report-v1/key_points_v2': reportV1KeyPointsV2,
  'report-v1/reference': reportV1Reference,

  'landbank-d/a1-grading': landbankDA1Grading,
  'landbank-d/a4-advice': landbankDA4Advice,

  'analysis/a1-grading-full': analysisA1GradingFull,
  'analysis/a4-advice-full': analysisA4AdviceFull,

  'srt/chat_role_detect': srtChatRoleDetect,

  'translate/simple': translatePrompt,
}