import { invariant, logger } from 'tkt'

import * as CodeRepository from './CodeRepository'
import { ICreateIssueInput } from './types'

const log = logger('TaskManagementSystem')

type TaskInformation = {
  title: string
  body: string
}

export async function createTask(
  information: TaskInformation,
): Promise<string> {
  const graphql = require('@octokit/graphql').defaults({
    headers: {
      authorization: `token ${
        process.env.GITHUB_TOKEN ||
        invariant(false, 'Required GITHUB_TOKEN variable.')
      }`,
    },
  })

  const input: ICreateIssueInput = {
    repositoryId: CodeRepository.repoContext.repositoryNodeId,
    title: information.title,
    body: information.body,
  }

  if (Object.prototype.hasOwnProperty.call(process.env, 'LABEL_IDS')) {
    input.labelIds = (process.env.LABEL_IDS || '').split(',')
  }
  if (Object.prototype.hasOwnProperty.call(process.env, 'MILESTONE_ID')) {
    input.milestoneId = process.env.MILESTONE_IDS || ''
  }

  const result = await graphql(
    `
      mutation CreateIssue($input: CreateIssueInput!) {
        createIssue(input: $input) {
          issue {
            number
          }
        }
      }
    `,
    { input },
  )
  log.debug('Create issue result:', result)
  return result.createIssue.issue.number
    ? `#${result.createIssue.issue.number}`
    : invariant(
        false,
        'Failed to get issue number out of createIssue API call.',
      )
}

export async function completeTask(taskReference: string): Promise<void> {
  const Octokit = (await import('@octokit/rest')).default
  const octokit = new Octokit({
    auth: `token ${
      process.env.GITHUB_TOKEN ||
      invariant(false, 'Required GITHUB_TOKEN variable.')
    }`,
  })
  const result = await octokit.issues.update({
    owner: CodeRepository.repoContext.repositoryOwner,
    repo: CodeRepository.repoContext.repositoryName,
    issue_number: +taskReference.substr(1),
    state: 'closed',
  })
  log.debug('Issue close result:', result.data)
}

export async function updateTask(
  taskReference: string,
  information: TaskInformation,
): Promise<void> {
  const Octokit = (await import('@octokit/rest')).default
  const octokit = new Octokit({
    auth: `token ${
      process.env.GITHUB_TOKEN ||
      invariant(false, 'Required GITHUB_TOKEN variable.')
    }`,
  })
  const result = await octokit.issues.update({
    owner: CodeRepository.repoContext.repositoryOwner,
    repo: CodeRepository.repoContext.repositoryName,
    issue_number: +taskReference.substr(1),
    title: information.title,
    body: information.body,
  })
  log.debug('Issue update result:', result.data)
}
