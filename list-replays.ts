import fetch from 'node-fetch';
import { SentryReplay, SentryProject } from './types';
import * as fs from 'fs';

// Get the Sentry auth token from environment variable
const SENTRY_AUTH = process.env.SENTRY_AUTH;
if (!SENTRY_AUTH) {
  console.error("Error: SENTRY_AUTH environment variable is required");
  process.exit(1);
}

async function getProjectId(organizationSlug: string, projectSlug: string): Promise<string | null> {
  try {
    const apiUrl = `https://sentry.io/api/0/organizations/${organizationSlug}/projects/`;
    
    console.log(`Fetching projects from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.status, errorText);
      return null;
    }

    const projects: SentryProject[] = await response.json();
    const project = projects.find(p => p.slug === projectSlug);
    
    if (!project) {
      console.error(`Project with slug "${projectSlug}" not found.`);
      return null;
    }
    
    console.log(`Found project: ${project.name} (ID: ${project.id})`);
    return project.id;
  } catch (error) {
    console.error('Error fetching project ID:', error);
    return null;
  }
}

async function listReplays() {
  const organizationSlug = 'buildwithcode';
  const projectSlug = 'anticrashcourse';
  
  try {
    // First, get the project ID
    const projectId = await getProjectId(organizationSlug, projectSlug);
    
    if (!projectId) {
      console.error('Could not get project ID. Exiting.');
      return;
    }
    
    // Construct the URL for the Sentry API
    let apiUrl = `https://sentry.io/api/0/organizations/${organizationSlug}/replays/`;
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('project', projectId);
    
    // Add the query parameters to the URL
    apiUrl += `?${queryParams.toString()}`;
    
    console.log(`Fetching replays from: ${apiUrl}`);
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.status, errorText);
      return;
    }

    // Parse the response
    const data = await response.json();
    
    // Format and print the replays
    if (data && data.data && Array.isArray(data.data)) {
      const replays = data.data as SentryReplay[];
      console.log(`\nFound ${replays.length} replays.`);
      
      // Create markdown output
      let markdownOutput = `# Replays for Organization: ${organizationSlug} - Project: ${projectSlug}\n\n`;
      
      // Summary table
      markdownOutput += `## Summary\n\n`;
      markdownOutput += `| # | ID | Started | Duration | Browser | Errors | Dead Clicks | Rage Clicks |\n`;
      markdownOutput += `|---|:---|:--------|:---------|:--------|:-------|:------------|:-----------|\n`;
      
      replays.forEach((replay, index) => {
        const startedDate = new Date(replay.started_at).toLocaleString();
        const duration = `${Math.floor(replay.duration / 60)}m ${replay.duration % 60}s`;
        const browser = `${replay.browser?.name || 'Unknown'} ${replay.browser?.version || ''}`;
        
        markdownOutput += `| ${index + 1} | ${replay.id} | ${startedDate} | ${duration} | ${browser} | ${replay.count_errors} | ${replay.count_dead_clicks} | ${replay.count_rage_clicks} |\n`;
      });
      
      // Detailed information
      markdownOutput += `\n## Detailed Information\n\n`;
      
      replays.forEach((replay, index) => {
        const startedDate = new Date(replay.started_at).toLocaleString();
        const finishedDate = replay.finished_at ? new Date(replay.finished_at).toLocaleString() : 'N/A';
        const duration = `${Math.floor(replay.duration / 60)}m ${replay.duration % 60}s`;
        
        markdownOutput += `### Replay ${index + 1}: ${replay.id}\n\n`;
        markdownOutput += `- **Started**: ${startedDate}\n`;
        markdownOutput += `- **Finished**: ${finishedDate}\n`;
        markdownOutput += `- **Duration**: ${duration}\n`;
        markdownOutput += `- **Browser**: ${replay.browser?.name} ${replay.browser?.version}\n`;
        markdownOutput += `- **Platform**: ${replay.platform}\n`;
        markdownOutput += `- **Environment**: ${replay.environment}\n`;
        markdownOutput += `- **Errors**: ${replay.count_errors}\n`;
        markdownOutput += `- **Dead Clicks**: ${replay.count_dead_clicks}\n`;
        markdownOutput += `- **Rage Clicks**: ${replay.count_rage_clicks}\n`;
        
        if (replay.urls && replay.urls.length > 0) {
          markdownOutput += `- **URLs**:\n`;
          replay.urls.forEach(url => {
            markdownOutput += `  - ${url}\n`;
          });
        }
        
        if (replay.user) {
          markdownOutput += `- **User**: ${replay.user.display_name || replay.user.email || replay.user.id || 'Anonymous'}\n`;
        }
        
        markdownOutput += `\n`;
      });
      
      // Write to file
      const outputFile = 'sentry-replays.md';
      fs.writeFileSync(outputFile, markdownOutput);
      console.log(`Markdown report written to ${outputFile}`);
      
      // Also print console output
      replays.forEach((replay, index) => {
        const startedDate = new Date(replay.started_at).toLocaleString();
        const finishedDate = replay.finished_at ? new Date(replay.finished_at).toLocaleString() : 'N/A';
        const duration = `${Math.floor(replay.duration / 60)}m ${replay.duration % 60}s`;
        
        console.log(`\n--- Replay ${index + 1} ---`);
        console.log(`ID: ${replay.id}`);
        console.log(`Project ID: ${replay.project_id}`);
        console.log(`Started: ${startedDate}`);
        console.log(`Finished: ${finishedDate}`);
        console.log(`Duration: ${duration}`);
        console.log(`Browser: ${replay.browser?.name} ${replay.browser?.version}`);
        console.log(`Platform: ${replay.platform}`);
        console.log(`Environment: ${replay.environment}`);
        console.log(`Errors: ${replay.count_errors}`);
        console.log(`Dead Clicks: ${replay.count_dead_clicks}`);
        console.log(`Rage Clicks: ${replay.count_rage_clicks}`);
        console.log(`URLs: ${replay.urls.join(', ')}`);
        
        if (replay.user) {
          console.log(`User: ${replay.user.display_name || replay.user.email || replay.user.id || 'Anonymous'}`);
        }
      });
    } else {
      console.log('No replays found or unexpected response format.');
    }
  } catch (error) {
    console.error('Error fetching replays:', error);
  }
}

// Run the function
listReplays();
