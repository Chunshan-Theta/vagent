"use client";

import { ServerEvent, SessionStatus, AgentConfig } from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRef, useMemo } from "react";
import { LogService } from '@/app/lib/log-service';

export interface UseHandleServerEventParams {
  setSessionStatus: (status: SessionStatus) => void;
  selectedAgentName: string;
  selectedAgentConfigSet: AgentConfig[] | null;
  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  setSelectedAgentName: (name: string) => void;
  shouldForceResponse?: boolean;
  hideLogs?: boolean;
}

export function useHandleServerEvent({
  setSessionStatus,
  selectedAgentName,
  selectedAgentConfigSet,
  sendClientEvent,
  setSelectedAgentName,
  hideLogs = false,
}: UseHandleServerEventParams) {
  const logService = useMemo(() => LogService.getInstance(), []);
  const {
    transcriptItems,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptItemStatus,
  } = useTranscript();

  // Use a try-catch to handle the case when EventContext is not available
  let logServerEvent;
  try {
    const eventContext = useEvent();
    logServerEvent = eventContext.logServerEvent;
  } catch (error) {
    console.warn("EventContext not available, using default values");
    logServerEvent = (eventObj: any, eventNameSuffix = "") => {
      console.log(`[Server Event] ${eventNameSuffix}:`, eventObj);
    };
  }

  const cancelAssistantSpeech = () => {
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!mostRecentAssistantMessage) {
      return;
    }
    if (mostRecentAssistantMessage.status === "DONE") {
      return;
    }

    sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAssistantMessage?.itemId,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAssistantMessage.createdAtMs,
    });
    sendClientEvent(
      { type: "response.cancel" },
      "(cancel due to new response)"
    );
  };

  const handleFunctionCall = async (functionCallParams: {
    name: string;
    call_id?: string;
    arguments: string;
  }) => {
    const args = JSON.parse(functionCallParams.arguments);
    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    if (!hideLogs) {
      addTranscriptBreadcrumb(`function call: ${functionCallParams.name}`, args);
    }

    if (currentAgent?.toolLogic?.[functionCallParams.name]) {
      const fn = currentAgent.toolLogic[functionCallParams.name];
      const fnResult = await fn(args, transcriptItems);
      if (!hideLogs) {
        addTranscriptBreadcrumb(
          `function call result: ${functionCallParams.name}`,
          fnResult
        );
      }

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(fnResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    } else if (functionCallParams.name === "transferAgents") {
      const destinationAgent = args.destination_agent;
      const newAgentConfig =
        selectedAgentConfigSet?.find((a) => a.name === destinationAgent) || null;
      if (newAgentConfig) {
        setSelectedAgentName(destinationAgent);
      }
      const functionCallOutput = {
        destination_agent: destinationAgent,
        did_transfer: !!newAgentConfig,
      };
      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(functionCallOutput),
        },
      });
      if (!hideLogs) {
        addTranscriptBreadcrumb(
          `function call: ${functionCallParams.name} response`,
          functionCallOutput
        );
      }
    } else {
      const simulatedResult = { result: true };
      if (!hideLogs) {
        addTranscriptBreadcrumb(
          `function call fallback: ${functionCallParams.name}`,
          simulatedResult
        );
      }

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(simulatedResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    }
  };

  const handleServerEvent = async (serverEvent: ServerEvent) => {
    logServerEvent(serverEvent);

    switch (serverEvent.type) {
      case "session.created": {
        if (serverEvent.session?.id) {
          setSessionStatus("CONNECTED");
          if (!hideLogs) {
            addTranscriptBreadcrumb(
              `session.id: ${
                serverEvent.session.id
              }\nStarted at: ${new Date().toLocaleString()}`
            );
          }
          await logService.logEvent({
            event_name: 'session_created',
            action_category: 'session',
            action_subtype: 'create',
            action_properties: {
              sessionId: serverEvent.session.id,
              timestamp: new Date().toISOString()
            }
          });
        }
        break;
      }

      case "conversation.item.created": {
        let text =
          serverEvent.item?.content?.[0]?.text ||
          serverEvent.item?.content?.[0]?.transcript ||
          "";
        const role = serverEvent.item?.role as "user" | "assistant";
        const itemId = serverEvent.item?.id;

        if (itemId && transcriptItems.some((item) => item.itemId === itemId)) {
          break;
        }

        if (itemId && role) {
          if (role === "user" && !text) {
            text = "[Transcribing...]\n";
          }
          addTranscriptMessage(itemId, role, text);
          if (role === "assistant" && text === "") {
            sendClientEvent(
              { type: "response.create" },
              "(trigger response after simulated user text message)"
            );
          }

          // Log AI responses
          if (role === "assistant" && text) {
            await logService.logEvent({
              event_name: 'ai_response',
              action_category: 'conversation',
              action_subtype: 'assistant_message',
              action_properties: {
                content: text,
                itemId: itemId
              }
            });
          }
        }
        break;
      }

      case "response.created": {
        // Cancel any ongoing assistant speech when a new response starts
        cancelAssistantSpeech();
        break;
      }

      // STT 文字 update
      case "conversation.item.input_audio_transcription.delta": {
        const itemId = serverEvent.item_id;
        const deltaText = serverEvent.delta || "";
        if (itemId) {
          // STT 的中途結果有 bug ，某些 token 會因為被切半導致變成亂碼
          // 現在不再做動態更新
          // updateTranscriptMessage(itemId, deltaText, true);
        }
        break;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const itemId = serverEvent.item_id;
        const text = (serverEvent.transcript || "").trim();
        const finalTranscript = !text ? "[inaudible]" : text;
        if (itemId) {
          updateTranscriptMessage(itemId, finalTranscript, false);
          updateTranscriptItemStatus(itemId, "DONE");
        }
        break;
      }

      case "response.audio_transcript.delta":
      case "response.text.delta": {
        const itemId = serverEvent.item_id;
        const deltaText = serverEvent.delta || "";
        if (itemId) {
          updateTranscriptMessage(itemId, deltaText, true);
        }
        break;
      }

      case "response.done": {
        if (serverEvent.response?.output) {
          await logService.logEvent({
            event_name: 'ai_response_complete',
            action_category: 'conversation',
            action_subtype: 'assistant_message_complete',
            action_properties: {
              output: serverEvent.response.output
            }
          });

          serverEvent.response.output.forEach((outputItem) => {
            if (
              outputItem.type === "function_call" &&
              outputItem.name &&
              outputItem.arguments
            ) {
              handleFunctionCall({
                name: outputItem.name,
                call_id: outputItem.call_id,
                arguments: outputItem.arguments,
              });
            }
          });
        }
        break;
      }

      case "response.output_item.done": {
        const itemId = serverEvent.item?.id;
        if (itemId) {
          updateTranscriptItemStatus(itemId, "DONE");
        }
        break;
      }

      default:
        break;
    }
  };

  const handleServerEventRef = useRef(handleServerEvent);
  handleServerEventRef.current = handleServerEvent;

  return handleServerEventRef;
}
