// Slack integration for notifications
// Configure SLACK_WEBHOOK_URL in environment variables

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

interface SlackMessage {
  text: string
  blocks?: Array<{
    type: string
    text?: {
      type: string
      text: string
      emoji?: boolean
    }
    accessory?: {
      type: string
      text?: {
        type: string
        text: string
      }
      url?: string
    }
  }>
}

async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.log("Slack webhook not configured, skipping notification")
    return false
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    return response.ok
  } catch (error) {
    console.error("Failed to send Slack notification:", error)
    return false
  }
}

export async function notifyNewWeekContent(
  weekNumber: number,
  weekTitle: string,
  baseUrl: string
): Promise<boolean> {
  return sendSlackMessage({
    text: `New content published for Week ${weekNumber}: ${weekTitle}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Content Published* :books:\n\nWeek ${weekNumber}: *${weekTitle}* is now available!`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Week",
          },
          url: `${baseUrl}/weeks/${weekNumber}`,
        },
      },
    ],
  })
}

export async function notifyBadgeAwarded(
  recipientName: string,
  badgeName: string,
  awardedByName: string,
  baseUrl: string
): Promise<boolean> {
  return sendSlackMessage({
    text: `${recipientName} earned the "${badgeName}" badge!`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Badge Awarded* :trophy:\n\n*${recipientName}* earned the *${badgeName}* badge!\n\nAwarded by ${awardedByName}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Badges",
          },
          url: `${baseUrl}/badges`,
        },
      },
    ],
  })
}

export async function notifyDemoSubmitted(
  userName: string,
  demoTitle: string,
  weekNumber: number,
  baseUrl: string
): Promise<boolean> {
  return sendSlackMessage({
    text: `${userName} submitted a new demo: ${demoTitle}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Demo Submitted* :rocket:\n\n*${userName}* shared a demo for Week ${weekNumber}:\n_${demoTitle}_`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Demo",
          },
          url: `${baseUrl}/weeks/${weekNumber}`,
        },
      },
    ],
  })
}
