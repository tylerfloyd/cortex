---
id: "80f242b1-b57f-468e-ba57-0bfd2f174d08"
title: "GitHub - affaan-m/everything-claude-code: The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond. · GitHub"
url: "https://github.com/affaan-m/everything-claude-code"
source_type: "article"
author: ""
published: 
captured: "2026-03-23T05:15:44.688Z"
capture_source: "discord"
category: "ai-ml"
tags: ["claude", "ai-coding-assistant", "ai-agents", "custom-commands", "project-configuration", "developer-tools", "workflow-automation", "best-practices", "mcp-protocol", "agent-framework", "multi-language-support", "security-controls", "performance-optimization"]
content_type: "reference"
difficulty: "advanced"
read_time_minutes: 8
---
# GitHub - affaan-m/everything-claude-code: The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond. · GitHub

## Summary

Everything Claude Code (ECC) is a comprehensive agent harness and performance optimization system for AI coding assistants like Claude Code, Codex, OpenCode, and Cursor. The project has achieved significant traction with 98.9K stars and 12.9K forks on GitHub. Version 1.9.0 represents a major release featuring selective install architecture, 27 specialized agents, 117 skills, 57 commands, and support for 12+ programming language ecosystems. The system provides skills, instincts, memory management, security controls, and research-first development patterns.

The repository includes extensive infrastructure: agent definitions for tasks like Flutter review and documentation lookup, MCP (Model Context Protocol) server configurations, platform-specific configurations for Claude Code/Codex/Cursor/Kiro/OpenCode, pre-commit hooks for security, behavioral compliance measurement tools, and multi-language rules covering Python, TypeScript, PHP/Laravel, C#, and more. Recent updates focus on config protection hooks to prevent AI agents from modifying linter configs, safe Codex config synchronization, and automated compliance testing via the skill-comply tool.

## Key Insights

- ECC has achieved massive community adoption (98.9K+ stars, 12.9K forks) and provides a production-ready harness for AI coding agents across multiple platforms with 27 agents, 117 skills, and 57 commands
- The v1.9.0 release introduces selective install architecture, session/state infrastructure, and comprehensive security controls including config protection hooks and behavioral compliance measurement
- The project supports extensive language ecosystems (12+) with specialized agents (Flutter reviewer, docs lookup, PyTorch build resolver) and integrates with MCP servers for external tool orchestration
- Security is a first-class concern with dedicated hooks blocking git hook bypasses, config manipulation prevention, input sanitization guidance, and published security playbooks addressing agentic attack vectors
- The architecture separates concerns across .agents (OpenAI/generic), .claude (Claude-specific), .codex (Codex-specific), .cursor (Cursor-specific), .kiro (Kiro-specific), and .opencode directories with comprehensive test coverage (1421+ tests)

## Source Content

# GitHub - affaan-m/everything-claude-code: The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond. · GitHub

[Skip to content](https://github.com/affaan-m/everything-claude-code#start-of-content)
## Navigation Menu

Toggle navigation

[](https://github.com/)

[Sign in](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Faffaan-m%2Feverything-claude-code)

Appearance settings

*   
Platform

    *   
AI CODE CREATION
        *   [GitHub Copilot Write better code with AI](https://github.com/features/copilot)
        *   [GitHub Spark Build and deploy intelligent apps](https://github.com/features/spark)
        *   [GitHub Models Manage and compare prompts](https://github.com/features/models)
        *   [MCP Registry New Integrate external tools](https://github.com/mcp)

    *   
DEVELOPER WORKFLOWS
        *   [Actions Automate any workflow](https://github.com/features/actions)
        *   [Codespaces Instant dev environments](https://github.com/features/codespaces)
        *   [Issues Plan and track work](https://github.com/features/issues)
        *   [Code Review Manage code changes](https://github.com/features/code-review)

    *   
APPLICATION SECURITY
        *   [GitHub Advanced Security Find and fix vulnerabilities](https://github.com/security/advanced-security)
        *   [Code security Secure your code as you build](https://github.com/security/advanced-security/code-security)
        *   [Secret protection Stop leaks before they start](https://github.com/security/advanced-security/secret-protection)

    *   
EXPLORE
        *   [Why GitHub](https://github.com/why-github)
        *   [Documentation](https://docs.github.com/)
        *   [Blog](https://github.blog/)
        *   [Changelog](https://github.blog/changelog)
        *   [Marketplace](https://github.com/marketplace)

[View all features](https://github.com/features)

*   
Solutions

    *   
BY COMPANY SIZE
        *   [Enterprises](https://github.com/enterprise)
        *   [Small and medium teams](https://github.com/team)
        *   [Startups](https://github.com/enterprise/startups)
        *   [Nonprofits](https://github.com/solutions/industry/nonprofits)

    *   
BY USE CASE
        *   [App Modernization](https://github.com/solutions/use-case/app-modernization)
        *   [DevSecOps](https://github.com/solutions/use-case/devsecops)
        *   [DevOps](https://github.com/solutions/use-case/devops)
        *   [CI/CD](https://github.com/solutions/use-case/ci-cd)
        *   [View all use cases](https://github.com/solutions/use-case)

    *   
BY INDUSTRY
        *   [Healthcare](https://github.com/solutions/industry/healthcare)
        *   [Financial services](https://github.com/solutions/industry/financial-services)
        *   [Manufacturing](https://github.com/solutions/industry/manufacturing)
        *   [Government](https://github.com/solutions/industry/government)
        *   [View all industries](https://github.com/solutions/industry)

[View all solutions](https://github.com/solutions)

*   
Resources

    *   
EXPLORE BY TOPIC
        *   [AI](https://github.com/resources/articles?topic=ai)
        *   [Software Development](https://github.com/resources/articles?topic=software-development)
        *   [DevOps](https://github.com/resources/articles?topic=devops)
        *   [Security](https://github.com/resources/articles?topic=security)
        *   [View all topics](https://github.com/resources/articles)

    *   
EXPLORE BY TYPE
        *   [Customer stories](https://github.com/customer-stories)
        *   [Events & webinars](https://github.com/resources/events)
        *   [Ebooks & reports](https://github.com/resources/whitepapers)
        *   [Business insights](https://github.com/solutions/executive-insights)
        *   [GitHub Skills](https://skills.github.com/)

    *   
SUPPORT & SERVICES
        *   [Documentation](https://docs.github.com/)
        *   [Customer support](https://support.github.com/)
        *   [Community forum](https://github.com/orgs/community/discussions)
        *   [Trust center](https://github.com/trust-center)
        *   [Partners](https://github.com/partners)

[View all resources](https://github.com/resources)

*   
Open Source

    *   
COMMUNITY
        *   [GitHub Sponsors Fund open source developers](https://github.com/sponsors)

    *   
PROGRAMS
        *   [Security Lab](https://securitylab.github.com/)
        *   [Maintainer Community](https://maintainers.github.com/)
        *   [Accelerator](https://github.com/accelerator)
        *   [GitHub Stars](https://stars.github.com/)
        *   [Archive Program](https://archiveprogram.github.com/)

    *   
REPOSITORIES
        *   [Topics](https://github.com/topics)
        *   [Trending](https://github.com/trending)
        *   [Collections](https://github.com/collections)

*   
Enterprise

    *   
ENTERPRISE SOLUTIONS
        *   [Enterprise platform AI-powered developer platform](https://github.com/enterprise)

    *   
AVAILABLE ADD-ONS
        *   [GitHub Advanced Security Enterprise-grade security features](https://github.com/security/advanced-security)
        *   [Copilot for Business Enterprise-grade AI features](https://github.com/features/copilot/copilot-business)
        *   [Premium Support Enterprise-grade 24/7 support](https://github.com/premium-support)

*   [Pricing](https://github.com/pricing)

Search or jump to...

# Search code, repositories, users, issues, pull requests...

 Search  

Clear

[Search syntax tips](https://docs.github.com/search-github/github-code-search/understanding-github-code-search-syntax)

# Provide feedback

We read every piece of feedback, and take your input very seriously.

- [x] Include my email address so I can be contacted 

 Cancel  Submit feedback 

# Saved searches

## Use saved searches to filter your results more quickly

Name 

Query 

To see all available qualifiers, see our [documentation](https://docs.github.com/search-github/github-code-search/understanding-github-code-search-syntax).

 Cancel  Create saved search 

[Sign in](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Faffaan-m%2Feverything-claude-code)

[Sign up](https://github.com/signup?ref_cta=Sign+up&ref_loc=header+logged+out&ref_page=%2F%3Cuser-name%3E%2F%3Crepo-name%3E&source=header-repo&source_repo=affaan-m%2Feverything-claude-code)

Appearance settings

Resetting focus

You signed in with another tab or window. [Reload](https://github.com/affaan-m/everything-claude-code) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/affaan-m/everything-claude-code) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/affaan-m/everything-claude-code) to refresh your session.Dismiss alert

{{ message }}

[affaan-m](https://github.com/affaan-m)/**[everything-claude-code](https://github.com/affaan-m/everything-claude-code)**Public

*   Sponsor# Sponsor affaan-m/everything-claude-code    ##### GitHub Sponsors

[Learn more about Sponsors](https://github.com/sponsors) [![Image 1: @affaan-m](https://avatars.githubusercontent.com/u/124439313?s=80&v=4)](https://github.com/affaan-m)[affaan-m](https://github.com/affaan-m)

[affaan-m](https://github.com/affaan-m) [Sponsor](https://github.com/sponsors/affaan-m)    
##### External links

 [https://ecc.tools](https://ecc.tools/)   [Learn more about funding links in repositories](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository).

[Report abuse](https://github.com/contact/report-abuse?report=affaan-m%2Feverything-claude-code+%28Repository+Funding+Links%29)   
*   [Notifications](https://github.com/login?return_to=%2Faffaan-m%2Feverything-claude-code)You must be signed in to change notification settings
*   [Fork 12.9k](https://github.com/login?return_to=%2Faffaan-m%2Feverything-claude-code)
*   [Star 98.9k](https://github.com/login?return_to=%2Faffaan-m%2Feverything-claude-code) 

*   [Code](https://github.com/affaan-m/everything-claude-code)
*   [Issues 70](https://github.com/affaan-m/everything-claude-code/issues)
*   [Pull requests 11](https://github.com/affaan-m/everything-claude-code/pulls)
*   [Discussions](https://github.com/affaan-m/everything-claude-code/discussions)
*   [Actions](https://github.com/affaan-m/everything-claude-code/actions)
*   [Projects](https://github.com/affaan-m/everything-claude-code/projects)
*   [Security 0](https://github.com/affaan-m/everything-claude-code/security)
*   [Insights](https://github.com/affaan-m/everything-claude-code/pulse)

Additional navigation options

*   [Code](https://github.com/affaan-m/everything-claude-code)
*   [Issues](https://github.com/affaan-m/everything-claude-code/issues)
*   [Pull requests](https://github.com/affaan-m/everything-claude-code/pulls)
*   [Discussions](https://github.com/affaan-m/everything-claude-code/discussions)
*   [Actions](https://github.com/affaan-m/everything-claude-code/actions)
*   [Projects](https://github.com/affaan-m/everything-claude-code/projects)
*   [Security](https://github.com/affaan-m/everything-claude-code/security)
*   [Insights](https://github.com/affaan-m/everything-claude-code/pulse)

[](https://github.com/affaan-m/everything-claude-code)

# affaan-m/everything-claude-code

main

[**2**Branches](https://github.com/affaan-m/everything-claude-code/branches)[**12**Tags](https://github.com/affaan-m/everything-claude-code/tags)

[](https://github.com/affaan-m/everything-claude-code/branches)[](https://github.com/affaan-m/everything-claude-code/tags)

Go to file

Code

Open more actions menu

## Folders and files

| Name | Name | Last commit message | Last commit date |
| --- | --- | --- | --- |
| ## Latest commit ![Image 2: ihimanss](https://avatars.githubusercontent.com/u/268042153?v=4&size=40)![Image 3: aws-hsungmin](https://avatars.githubusercontent.com/u/135075700?v=4&size=40) [ihimanss](https://github.com/affaan-m/everything-claude-code/commits?author=ihimanss) and [aws-hsungmin](https://github.com/affaan-m/everything-claude-code/commits?author=aws-hsungmin) [Add Kiro steering files, hooks, and scripts (](https://github.com/affaan-m/everything-claude-code/commit/bacc585b877b4426627d1cc478e1f1e5eb0c4f94)[#812](https://github.com/affaan-m/everything-claude-code/pull/812)[)](https://github.com/affaan-m/everything-claude-code/commit/bacc585b877b4426627d1cc478e1f1e5eb0c4f94) Open commit details failure Mar 23, 2026 [bacc585](https://github.com/affaan-m/everything-claude-code/commit/bacc585b877b4426627d1cc478e1f1e5eb0c4f94)·Mar 23, 2026 ## History [768 Commits](https://github.com/affaan-m/everything-claude-code/commits/main/) Open commit details [](https://github.com/affaan-m/everything-claude-code/commits/main/)768 Commits |
| [.agents/skills](https://github.com/affaan-m/everything-claude-code/tree/main/.agents/skills "This path skips through empty directories") | [.agents/skills](https://github.com/affaan-m/everything-claude-code/tree/main/.agents/skills "This path skips through empty directories") | [feat(rules): add C# language support (](https://github.com/affaan-m/everything-claude-code/commit/40f18885b19d06855c9a90c9d8e86c9a5c425689 "feat(rules): add C# language support (#704) * feat(rules): add C# language support * feat: add everything-claude-code ECC bundle (#705) * feat: add everything-claude-code ECC bundle (.claude/ecc-tools.json) * feat: add everything-claude-code ECC bundle (.claude/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/agents/openai.yaml) * feat: add everything-claude-code ECC bundle (.claude/identity.json) * feat: add everything-claude-code ECC bundle (.codex/agents/explorer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/reviewer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/docs-researcher.toml) * feat: add everything-claude-code ECC bundle (.claude/rules/everything-claude-code-guardrails.md) * feat: add everything-claude-code ECC bundle (.claude/research/everything-claude-code-research-playbook.md) * feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json) * feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md) * feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md) * feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md) * feat: add everything-claude-code ECC bundle (.claude/commands/add-language-rules.md) --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com> * ci: retrigger --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com>")[#704](https://github.com/affaan-m/everything-claude-code/pull/704)[)](https://github.com/affaan-m/everything-claude-code/commit/40f18885b19d06855c9a90c9d8e86c9a5c425689 "feat(rules): add C# language support (#704) * feat(rules): add C# language support * feat: add everything-claude-code ECC bundle (#705) * feat: add everything-claude-code ECC bundle (.claude/ecc-tools.json) * feat: add everything-claude-code ECC bundle (.claude/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/agents/openai.yaml) * feat: add everything-claude-code ECC bundle (.claude/identity.json) * feat: add everything-claude-code ECC bundle (.codex/agents/explorer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/reviewer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/docs-researcher.toml) * feat: add everything-claude-code ECC bundle (.claude/rules/everything-claude-code-guardrails.md) * feat: add everything-claude-code ECC bundle (.claude/research/everything-claude-code-research-playbook.md) * feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json) * feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md) * feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md) * feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md) * feat: add everything-claude-code ECC bundle (.claude/commands/add-language-rules.md) --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com> * ci: retrigger --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com>") | Mar 20, 2026 |
| [.claude-plugin](https://github.com/affaan-m/everything-claude-code/tree/main/.claude-plugin ".claude-plugin") | [.claude-plugin](https://github.com/affaan-m/everything-claude-code/tree/main/.claude-plugin ".claude-plugin") | [fix: bump plugin.json and marketplace.json to v1.9.0](https://github.com/affaan-m/everything-claude-code/commit/bb1efad7c7971caa653ff6ae62e8bb7e6868db54 "fix: bump plugin.json and marketplace.json to v1.9.0 Both files were stuck at v1.8.0, blocking upgrades via claudepluginhub.") | Mar 22, 2026 |
| [.claude](https://github.com/affaan-m/everything-claude-code/tree/main/.claude ".claude") | [.claude](https://github.com/affaan-m/everything-claude-code/tree/main/.claude ".claude") | [feat(rules): add C# language support (](https://github.com/affaan-m/everything-claude-code/commit/40f18885b19d06855c9a90c9d8e86c9a5c425689 "feat(rules): add C# language support (#704) * feat(rules): add C# language support * feat: add everything-claude-code ECC bundle (#705) * feat: add everything-claude-code ECC bundle (.claude/ecc-tools.json) * feat: add everything-claude-code ECC bundle (.claude/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/agents/openai.yaml) * feat: add everything-claude-code ECC bundle (.claude/identity.json) * feat: add everything-claude-code ECC bundle (.codex/agents/explorer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/reviewer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/docs-researcher.toml) * feat: add everything-claude-code ECC bundle (.claude/rules/everything-claude-code-guardrails.md) * feat: add everything-claude-code ECC bundle (.claude/research/everything-claude-code-research-playbook.md) * feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json) * feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md) * feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md) * feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md) * feat: add everything-claude-code ECC bundle (.claude/commands/add-language-rules.md) --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com> * ci: retrigger --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com>")[#704](https://github.com/affaan-m/everything-claude-code/pull/704)[)](https://github.com/affaan-m/everything-claude-code/commit/40f18885b19d06855c9a90c9d8e86c9a5c425689 "feat(rules): add C# language support (#704) * feat(rules): add C# language support * feat: add everything-claude-code ECC bundle (#705) * feat: add everything-claude-code ECC bundle (.claude/ecc-tools.json) * feat: add everything-claude-code ECC bundle (.claude/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/agents/openai.yaml) * feat: add everything-claude-code ECC bundle (.claude/identity.json) * feat: add everything-claude-code ECC bundle (.codex/agents/explorer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/reviewer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/docs-researcher.toml) * feat: add everything-claude-code ECC bundle (.claude/rules/everything-claude-code-guardrails.md) * feat: add everything-claude-code ECC bundle (.claude/research/everything-claude-code-research-playbook.md) * feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json) * feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md) * feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md) * feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md) * feat: add everything-claude-code ECC bundle (.claude/commands/add-language-rules.md) --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com> * ci: retrigger --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com>") | Mar 20, 2026 |
| [.codex](https://github.com/affaan-m/everything-claude-code/tree/main/.codex ".codex") | [.codex](https://github.com/affaan-m/everything-claude-code/tree/main/.codex ".codex") | [fix: safe Codex config sync — merge AGENTS.md + add-only MCP servers (](https://github.com/affaan-m/everything-claude-code/commit/09efd682284ffb8f3d9a0f4960fd382e0db94cda "fix: safe Codex config sync — merge AGENTS.md + add-only MCP servers (#723) * fix: replace bash TOML surgery with Node add-only MCP merge The old sync script used awk/sed to remove and re-append MCP server sections in config.toml, causing credential extraction races, duplicate TOML tables, and 3 fragile code paths with 9 remove_section_inplace calls each. Replace with a Node script (scripts/codex/merge-mcp-config.js) that uses @iarna/toml to parse the config, then appends only missing ECC servers — preserving all existing content byte-for-byte. Warns on config drift, supports legacy aliases (context7 → context7-mcp), and adds --update-mcp flag for explicit refresh. Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> * fix: address PR #723 review findings for Codex MCP merge - Use package-manager abstraction (scripts/lib/package-manager.js) instead of hardcoding pnpm — respects CLAUDE_PACKAGE_MANAGER, lock files, and project config - Add Yarn 1.x fallback to npx (yarn dlx unsupported in classic) - Add missing exa server to match .codex/config.toml baseline - Wire up findSubSections for --update-mcp nested subtable removal (fixes Greptile P1: Object.keys only returned top-level keys) - Fix resolvedLabel to prefer canonical entry over legacy alias when both exist (fixes context7/context7-mcp spurious warning) - Fix removeSectionFromText to handle inline TOML comments - Fix dry-run + --update-mcp to show removals before early return - Update README parity table: 4 → 7 servers, TOML-parser-based - Add non-npm install variants to README Codex quick start - Update package-lock.json for @iarna/toml Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> * fix: address PR #723 review comments (preflight, marker validation) - Add Node.js and merge-mcp-config.js to preflight checks so the script fails fast before partial writes (CodeRabbit) - Validate marker counts: require exactly 1 BEGIN + 1 END in correct order for clean replacement (CodeRabbit) - Corrupted markers: strip all marker lines and re-append fresh block, preserving user content outside markers instead of overwriting - Move MCP_MERGE_SCRIPT to preflight section, remove duplicate Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> --------- Co-authored-by: Claude <noreply@anthropic.com> Co-authored-by: Happy <yesreply@happy.engineering>")[#…](https://github.com/affaan-m/everything-claude-code/pull/723) | Mar 22, 2026 |
| [.cursor](https://github.com/affaan-m/everything-claude-code/tree/main/.cursor ".cursor") | [.cursor](https://github.com/affaan-m/everything-claude-code/tree/main/.cursor ".cursor") | [feat: add block-no-verify hook for Claude Code and Cursor (](https://github.com/affaan-m/everything-claude-code/commit/c8f631b0466ee963abc001b14421471ea6221176 "feat: add block-no-verify hook for Claude Code and Cursor (#649) Adds npx block-no-verify@1.1.2 as a PreToolUse Bash hook in hooks/hooks.json and a beforeShellExecution hook in .cursor/hooks.json to prevent AI agents from bypassing git hooks via the hook-bypass flag. This closes the last enforcement gap in the ECC security stack — the bypass flag silently skips pre-commit, commit-msg, and pre-push hooks. Closes #648 Co-authored-by: Claude Sonnet 4.6 <noreply@anthropic.com>")[#649](https://github.com/affaan-m/everything-claude-code/pull/649)[)](https://github.com/affaan-m/everything-claude-code/commit/c8f631b0466ee963abc001b14421471ea6221176 "feat: add block-no-verify hook for Claude Code and Cursor (#649) Adds npx block-no-verify@1.1.2 as a PreToolUse Bash hook in hooks/hooks.json and a beforeShellExecution hook in .cursor/hooks.json to prevent AI agents from bypassing git hooks via the hook-bypass flag. This closes the last enforcement gap in the ECC security stack — the bypass flag silently skips pre-commit, commit-msg, and pre-push hooks. Closes #648 Co-authored-by: Claude Sonnet 4.6 <noreply@anthropic.com>") | Mar 20, 2026 |
| [.github](https://github.com/affaan-m/everything-claude-code/tree/main/.github ".github") | [.github](https://github.com/affaan-m/everything-claude-code/tree/main/.github ".github") | [chore(config): governance and config foundation (](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)")[#292](https://github.com/affaan-m/everything-claude-code/pull/292)[)](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)") | Mar 16, 2026 |
| [.kiro](https://github.com/affaan-m/everything-claude-code/tree/main/.kiro ".kiro") | [.kiro](https://github.com/affaan-m/everything-claude-code/tree/main/.kiro ".kiro") | [Add Kiro steering files, hooks, and scripts (](https://github.com/affaan-m/everything-claude-code/commit/bacc585b877b4426627d1cc478e1f1e5eb0c4f94 "Add Kiro steering files, hooks, and scripts (#812) Co-authored-by: Sungmin Hong <hsungmin@amazon.com>")[#812](https://github.com/affaan-m/everything-claude-code/pull/812)[)](https://github.com/affaan-m/everything-claude-code/commit/bacc585b877b4426627d1cc478e1f1e5eb0c4f94 "Add Kiro steering files, hooks, and scripts (#812) Co-authored-by: Sungmin Hong <hsungmin@amazon.com>") | Mar 23, 2026 |
| [.opencode](https://github.com/affaan-m/everything-claude-code/tree/main/.opencode ".opencode") | [.opencode](https://github.com/affaan-m/everything-claude-code/tree/main/.opencode ".opencode") | [perf(hooks): move post-edit-format and post-edit-typecheck to strict-…](https://github.com/affaan-m/everything-claude-code/commit/0c7deb26a344db095c04a213eba5634d4ccce030 "perf(hooks): move post-edit-format and post-edit-typecheck to strict-only (#757) * perf(hooks): move post-edit-format and post-edit-typecheck to strict-only These hooks fire synchronously on every Edit call with 15-30s timeouts each. During multi-file refactors this adds 5-10 minutes of overhead. Moving them from standard,strict to strict-only means they won't fire in the default profile but are still available for users who want the extra validation. Fixes #735 * Also update OpenCode plugin to strict-only for format/typecheck The OpenCode plugin had the same standard,strict profile for post:edit:format and post:edit:typecheck, so OpenCode users on the default profile would still get the per-edit overhead.") | Mar 22, 2026 |
| [agents](https://github.com/affaan-m/everything-claude-code/tree/main/agents "agents") | [agents](https://github.com/affaan-m/everything-claude-code/tree/main/agents "agents") | [feat(agents): add flutter-reviewer agent and skill (](https://github.com/affaan-m/everything-claude-code/commit/1975a576c5ccd0b2e8714a8c00b0fd1de096eac7 "feat(agents): add flutter-reviewer agent and skill (#716) Library-agnostic Flutter/Dart code reviewer that adapts to the project's chosen state management solution (BLoC, Riverpod, Provider, GetX, MobX, Signals) and architecture pattern (Clean Architecture, MVVM, feature-first). Co-authored-by: Maciej Starosielec <maciej@code-snap.com> Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>")[#716](https://github.com/affaan-m/everything-claude-code/pull/716)[)](https://github.com/affaan-m/everything-claude-code/commit/1975a576c5ccd0b2e8714a8c00b0fd1de096eac7 "feat(agents): add flutter-reviewer agent and skill (#716) Library-agnostic Flutter/Dart code reviewer that adapts to the project's chosen state management solution (BLoC, Riverpod, Provider, GetX, MobX, Signals) and architecture pattern (Clean Architecture, MVVM, feature-first). Co-authored-by: Maciej Starosielec <maciej@code-snap.com> Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>") | Mar 20, 2026 |
| [assets/images](https://github.com/affaan-m/everything-claude-code/tree/main/assets/images "This path skips through empty directories") | [assets/images](https://github.com/affaan-m/everything-claude-code/tree/main/assets/images "This path skips through empty directories") | [docs: publish The Shorthand Guide to Everything Agentic Security](https://github.com/affaan-m/everything-claude-code/commit/c1847bec5da83fe57eb61129bd3fd21e97ec9808 "docs: publish The Shorthand Guide to Everything Agentic Security Full article with embedded images: attack chain diagram, sandboxing comparison, sanitization visual, observability logging, ghostyy overflow. Tweet quotes from @TalBeerySec, @HedgieMarkets, @blackorbird formatted as blockquotes. Stats table fixed. Code blocks tagged. Links to shorthand and longform guides at bottom.") | Mar 21, 2026 |
| [commands](https://github.com/affaan-m/everything-claude-code/tree/main/commands "commands") | [commands](https://github.com/affaan-m/everything-claude-code/tree/main/commands "commands") | [fix(commands): replace py_compile with compileall in build-fix (](https://github.com/affaan-m/everything-claude-code/commit/a411da9122409b3a012305ccf62907cea56983f7 "fix(commands): replace py_compile with compileall in build-fix (#804) py_compile requires explicit filenames and exits with status 2 when invoked without them. compileall -q . recursively validates Python syntax across the entire project, which is what the build-fix command actually needs. Fixes #759")[#804](https://github.com/affaan-m/everything-claude-code/pull/804)[)](https://github.com/affaan-m/everything-claude-code/commit/a411da9122409b3a012305ccf62907cea56983f7 "fix(commands): replace py_compile with compileall in build-fix (#804) py_compile requires explicit filenames and exits with status 2 when invoked without them. compileall -q . recursively validates Python syntax across the entire project, which is what the build-fix command actually needs. Fixes #759") | Mar 23, 2026 |
| [contexts](https://github.com/affaan-m/everything-claude-code/tree/main/contexts "contexts") | [contexts](https://github.com/affaan-m/everything-claude-code/tree/main/contexts "contexts") | [Revert "feat(ecc): prune plugin 43→12 items, promote 7 rules to .clau…](https://github.com/affaan-m/everything-claude-code/commit/0e9f613fd196f6d4157765b17d39c2c42ebbf564 "Revert \"feat(ecc): prune plugin 43→12 items, promote 7 rules to .claude/rules/ (#245)\" This reverts commit 1bd68ff534202ac2bf8c1eb264ea33a1302907a6.") | Feb 20, 2026 |
| [docs](https://github.com/affaan-m/everything-claude-code/tree/main/docs "docs") | [docs](https://github.com/affaan-m/everything-claude-code/tree/main/docs "docs") | [docs: add ECC 2.0 reference architecture from competitor research](https://github.com/affaan-m/everything-claude-code/commit/0f22cb4450087dfa3999815573d6b197b1f2bab0 "docs: add ECC 2.0 reference architecture from competitor research Summarizes patterns from superset-sh/superset (Electron, 7.7K stars), standardagents/dmux (Ink TUI, 1.2K stars), and others. Defines the three-layer architecture (daemon + runtime + TUI) and patterns to adopt.") | Mar 22, 2026 |
| [examples](https://github.com/affaan-m/everything-claude-code/tree/main/examples "examples") | [examples](https://github.com/affaan-m/everything-claude-code/tree/main/examples "examples") | [feat: add laravel skills (](https://github.com/affaan-m/everything-claude-code/commit/113119dc6f35ced0fdbc4f4dd4184541bf0cc22f "feat: add laravel skills (#420) * feat: add laravel skills * docs: fix laravel patterns example * docs: add laravel api example * docs: update readme and configure-ecc for laravel skills * docs: reference laravel skills in php rules * docs: add php import guidance * docs: expand laravel skills with more pattern, security, testing, and verification examples * docs: add laravel routing, security, testing, and sail guidance * docs: fix laravel example issues from code review * docs: fix laravel examples and skills per review findings * docs: resolve remaining laravel review fixes * docs: refine laravel patterns and tdd guidance * docs: clarify laravel queue healthcheck guidance * docs: fix laravel examples and test guidance * docs: correct laravel tdd and api example details * docs: align laravel form request auth semantics * docs: fix laravel coverage, imports, and scope guidance * docs: align laravel tdd and security examples with guidance * docs: tighten laravel form request authorization examples * docs: fix laravel tdd and queue job examples * docs: harden laravel rate limiting and policy examples * docs: fix laravel pagination, validation, and verification examples * docs: align laravel controller response with envelope * docs: strengthen laravel password validation example * docs: address feedback regarding examples * docs: improve guidance and examples for pest usage * docs: clarify laravel upload storage and authorization notes * docs: tighten up examples")[#420](https://github.com/affaan-m/everything-claude-code/pull/420)[)](https://github.com/affaan-m/everything-claude-code/commit/113119dc6f35ced0fdbc4f4dd4184541bf0cc22f "feat: add laravel skills (#420) * feat: add laravel skills * docs: fix laravel patterns example * docs: add laravel api example * docs: update readme and configure-ecc for laravel skills * docs: reference laravel skills in php rules * docs: add php import guidance * docs: expand laravel skills with more pattern, security, testing, and verification examples * docs: add laravel routing, security, testing, and sail guidance * docs: fix laravel example issues from code review * docs: fix laravel examples and skills per review findings * docs: resolve remaining laravel review fixes * docs: refine laravel patterns and tdd guidance * docs: clarify laravel queue healthcheck guidance * docs: fix laravel examples and test guidance * docs: correct laravel tdd and api example details * docs: align laravel form request auth semantics * docs: fix laravel coverage, imports, and scope guidance * docs: align laravel tdd and security examples with guidance * docs: tighten laravel form request authorization examples * docs: fix laravel tdd and queue job examples * docs: harden laravel rate limiting and policy examples * docs: fix laravel pagination, validation, and verification examples * docs: align laravel controller response with envelope * docs: strengthen laravel password validation example * docs: address feedback regarding examples * docs: improve guidance and examples for pest usage * docs: clarify laravel upload storage and authorization notes * docs: tighten up examples") | Mar 16, 2026 |
| [hooks](https://github.com/affaan-m/everything-claude-code/tree/main/hooks "hooks") | [hooks](https://github.com/affaan-m/everything-claude-code/tree/main/hooks "hooks") | [perf(hooks): move post-edit-format and post-edit-typecheck to strict-…](https://github.com/affaan-m/everything-claude-code/commit/0c7deb26a344db095c04a213eba5634d4ccce030 "perf(hooks): move post-edit-format and post-edit-typecheck to strict-only (#757) * perf(hooks): move post-edit-format and post-edit-typecheck to strict-only These hooks fire synchronously on every Edit call with 15-30s timeouts each. During multi-file refactors this adds 5-10 minutes of overhead. Moving them from standard,strict to strict-only means they won't fire in the default profile but are still available for users who want the extra validation. Fixes #735 * Also update OpenCode plugin to strict-only for format/typecheck The OpenCode plugin had the same standard,strict profile for post:edit:format and post:edit:typecheck, so OpenCode users on the default profile would still get the per-edit overhead.") | Mar 22, 2026 |
| [manifests](https://github.com/affaan-m/everything-claude-code/tree/main/manifests "manifests") | [manifests](https://github.com/affaan-m/everything-claude-code/tree/main/manifests "manifests") | [fix: add antigravity to platform-configs targets](https://github.com/affaan-m/everything-claude-code/commit/264396a6169799b5c05b915930e7618520293fc6 "fix: add antigravity to platform-configs targets Fixes #813. The platform-configs module was missing antigravity from its targets array, causing all 13+ dependent modules to be skipped when installing with --target antigravity --profile full.") | Mar 23, 2026 |
| [mcp-configs](https://github.com/affaan-m/everything-claude-code/tree/main/mcp-configs "mcp-configs") | [mcp-configs](https://github.com/affaan-m/everything-claude-code/tree/main/mcp-configs "mcp-configs") | [Add Claude DevFleet multi-agent orchestration skill (](https://github.com/affaan-m/everything-claude-code/commit/ac53fbcd0ec41297b627474cbcaa0535c9383911 "Add Claude DevFleet multi-agent orchestration skill (#505) * Add Claude DevFleet multi-agent orchestration skill Adds a skill for Claude DevFleet — a multi-agent coding platform that dispatches Claude Code agents to work on missions in parallel, each in an isolated git worktree. The skill teaches Claude Code how to use DevFleet's 11 MCP tools to plan projects, dispatch agents, monitor progress, and read structured reports. Setup: claude mcp add devfleet --transport sse http://localhost:18801/mcp/sse Repo: https://github.com/LEC-AI/claude-devfleet * Add DevFleet MCP config and /devfleet command - Add devfleet entry to mcp-configs/mcp-servers.json for discovery - Add /devfleet slash command for multi-agent orchestration workflow * Add orchestration flow diagrams to skill and command - Add visual flow to SKILL.md showing plan → dispatch → auto-chain → report - Add flow to /devfleet command showing the trigger sequence * Fix review feedback: frontmatter, workflow docs, HTTP transport - Add YAML description frontmatter to commands/devfleet.md - Fix manual workflow in SKILL.md to capture project_id from create_project - Change mcp-servers.json from deprecated SSE to Streamable HTTP transport * Address all review comments * Add monitoring/reporting steps to full auto pattern Addresses review feedback: the full auto example now includes polling for completion and retrieving reports, matching the other patterns. Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com> * Update skills/claude-devfleet/SKILL.md Co-authored-by: cubic-dev-ai[bot] <191113872+cubic-dev-ai[bot]@users.noreply.github.com> * Update skills/claude-devfleet/SKILL.md Co-authored-by: greptile-apps[bot] <165735046+greptile-apps[bot]@users.noreply.github.com> * Update commands/devfleet.md Co-authored-by: greptile-apps[bot] <165735046+greptile-apps[bot]@users.noreply.github.com> * Fix review feedback Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com> --------- Co-authored-by: Avdhesh Singh Chouhan <avdhesh.acro@gmail.com> Co-authored-by: Claude Opus 4.6 <noreply@anthropic.com> Co-authored-by: cubic-dev-ai[bot] <191113872+cubic-dev-ai[bot]@users.noreply.github.com> Co-authored-by: greptile-apps[bot] <165735046+greptile-apps[bot]@users.noreply.github.com>")[#505](https://github.com/affaan-m/everything-claude-code/pull/505)[)](https://github.com/affaan-m/everything-claude-code/commit/ac53fbcd0ec41297b627474cbcaa0535c9383911 "Add Claude DevFleet multi-agent orchestration skill (#505) * Add Claude DevFleet multi-agent orchestration skill Adds a skill for Claude DevFleet — a multi-agent coding platform that dispatches Claude Code agents to work on missions in parallel, each in an isolated git worktree. The skill teaches Claude Code how to use DevFleet's 11 MCP tools to plan projects, dispatch agents, monitor progress, and read structured reports. Setup: claude mcp add devfleet --transport sse http://localhost:18801/mcp/sse Repo: https://github.com/LEC-AI/claude-devfleet * Add DevFleet MCP config and /devfleet command - Add devfleet entry to mcp-configs/mcp-servers.json for discovery - Add /devfleet slash command for multi-agent orchestration workflow * Add orchestration flow diagrams to skill and command - Add visual flow to SKILL.md showing plan → dispatch → auto-chain → report - Add flow to /devfleet command showing the trigger sequence * Fix review feedback: frontmatter, workflow docs, HTTP transport - Add YAML description frontmatter to commands/devfleet.md - Fix manual workflow in SKILL.md to capture project_id from create_project - Change mcp-servers.json from deprecated SSE to Streamable HTTP transport * Address all review comments * Add monitoring/reporting steps to full auto pattern Addresses review feedback: the full auto example now includes polling for completion and retrieving reports, matching the other patterns. Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com> * Update skills/claude-devfleet/SKILL.md Co-authored-by: cubic-dev-ai[bot] <191113872+cubic-dev-ai[bot]@users.noreply.github.com> * Update skills/claude-devfleet/SKILL.md Co-authored-by: greptile-apps[bot] <165735046+greptile-apps[bot]@users.noreply.github.com> * Update commands/devfleet.md Co-authored-by: greptile-apps[bot] <165735046+greptile-apps[bot]@users.noreply.github.com> * Fix review feedback Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com> --------- Co-authored-by: Avdhesh Singh Chouhan <avdhesh.acro@gmail.com> Co-authored-by: Claude Opus 4.6 <noreply@anthropic.com> Co-authored-by: cubic-dev-ai[bot] <191113872+cubic-dev-ai[bot]@users.noreply.github.com> Co-authored-by: greptile-apps[bot] <165735046+greptile-apps[bot]@users.noreply.github.com>") | Mar 16, 2026 |
| [plugins](https://github.com/affaan-m/everything-claude-code/tree/main/plugins "plugins") | [plugins](https://github.com/affaan-m/everything-claude-code/tree/main/plugins "plugins") | [chore: replace external repo links with @username attribution](https://github.com/affaan-m/everything-claude-code/commit/32e9c293f0d6f04e3b9bf804887747d5c8b5dc10 "chore: replace external repo links with @username attribution") | Mar 3, 2026 |
| [rules](https://github.com/affaan-m/everything-claude-code/tree/main/rules "rules") | [rules](https://github.com/affaan-m/everything-claude-code/tree/main/rules "rules") | [feat(rules): add C# language support (](https://github.com/affaan-m/everything-claude-code/commit/40f18885b19d06855c9a90c9d8e86c9a5c425689 "feat(rules): add C# language support (#704) * feat(rules): add C# language support * feat: add everything-claude-code ECC bundle (#705) * feat: add everything-claude-code ECC bundle (.claude/ecc-tools.json) * feat: add everything-claude-code ECC bundle (.claude/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/agents/openai.yaml) * feat: add everything-claude-code ECC bundle (.claude/identity.json) * feat: add everything-claude-code ECC bundle (.codex/agents/explorer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/reviewer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/docs-researcher.toml) * feat: add everything-claude-code ECC bundle (.claude/rules/everything-claude-code-guardrails.md) * feat: add everything-claude-code ECC bundle (.claude/research/everything-claude-code-research-playbook.md) * feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json) * feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md) * feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md) * feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md) * feat: add everything-claude-code ECC bundle (.claude/commands/add-language-rules.md) --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com> * ci: retrigger --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com>")[#704](https://github.com/affaan-m/everything-claude-code/pull/704)[)](https://github.com/affaan-m/everything-claude-code/commit/40f18885b19d06855c9a90c9d8e86c9a5c425689 "feat(rules): add C# language support (#704) * feat(rules): add C# language support * feat: add everything-claude-code ECC bundle (#705) * feat: add everything-claude-code ECC bundle (.claude/ecc-tools.json) * feat: add everything-claude-code ECC bundle (.claude/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/SKILL.md) * feat: add everything-claude-code ECC bundle (.agents/skills/everything-claude-code/agents/openai.yaml) * feat: add everything-claude-code ECC bundle (.claude/identity.json) * feat: add everything-claude-code ECC bundle (.codex/agents/explorer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/reviewer.toml) * feat: add everything-claude-code ECC bundle (.codex/agents/docs-researcher.toml) * feat: add everything-claude-code ECC bundle (.claude/rules/everything-claude-code-guardrails.md) * feat: add everything-claude-code ECC bundle (.claude/research/everything-claude-code-research-playbook.md) * feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json) * feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md) * feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md) * feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md) * feat: add everything-claude-code ECC bundle (.claude/commands/add-language-rules.md) --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com> * ci: retrigger --------- Co-authored-by: ecc-tools[bot] <257055122+ecc-tools[bot]@users.noreply.github.com>") | Mar 20, 2026 |
| [schemas](https://github.com/affaan-m/everything-claude-code/tree/main/schemas "schemas") | [schemas](https://github.com/affaan-m/everything-claude-code/tree/main/schemas "schemas") | [feat: define skill placement and provenance policy (](https://github.com/affaan-m/everything-claude-code/commit/4df960c9d5b58f27fb5e617f5da452ec63e9ae4e "feat: define skill placement and provenance policy (#748)")[#748](https://github.com/affaan-m/everything-claude-code/pull/748)[)](https://github.com/affaan-m/everything-claude-code/commit/4df960c9d5b58f27fb5e617f5da452ec63e9ae4e "feat: define skill placement and provenance policy (#748)") | Mar 22, 2026 |
| [scripts](https://github.com/affaan-m/everything-claude-code/tree/main/scripts "scripts") | [scripts](https://github.com/affaan-m/everything-claude-code/tree/main/scripts "scripts") | [feat(hooks): add config protection hook to block linter config manipu…](https://github.com/affaan-m/everything-claude-code/commit/fdb10ba11624cb17f59aa2fbe14363039afe3ca8 "feat(hooks): add config protection hook to block linter config manipulation (#758) * feat(hooks): add config protection hook to block linter config manipulation Agents frequently modify linter/formatter configs (.eslintrc, biome.json, .prettierrc, .ruff.toml, etc.) to make checks pass instead of fixing the actual code. This PreToolUse hook intercepts Write/Edit/MultiEdit calls targeting known config files and blocks them with a steering message that directs the agent to fix the source code instead. Covers: ESLint, Prettier, Biome, Ruff, ShellCheck, Stylelint, and Markdownlint configs. Fixes #733 * Address review: fix dead code, add missing configs, export run() - Removed pyproject.toml from PROTECTED_FILES (was dead code since it was also in PARTIAL_CONFIG_FILES). Added comment explaining why it's intentionally excluded. - Removed PARTIAL_CONFIG_FILES entirely (no longer needed). - Added missing ESLint v9 TypeScript flat configs: eslint.config.ts, eslint.config.mts, eslint.config.cts - Added missing Prettier ESM config: prettier.config.mjs - Exported run() function for in-process execution via run-with-flags, avoiding the spawnSync overhead (~50-100ms per call). * Handle stdin truncation gracefully, log warning instead of fail-open If stdin exceeds 1MB, the JSON would be malformed and the catch block would silently pass through. Now we detect truncation and log a warning. The in-process run() path is not affected.") | Mar 22, 2026 |
| [skills](https://github.com/affaan-m/everything-claude-code/tree/main/skills "skills") | [skills](https://github.com/affaan-m/everything-claude-code/tree/main/skills "skills") | [feat(skills): add skill-comply — automated behavioral compliance meas…](https://github.com/affaan-m/everything-claude-code/commit/a2e465c74dfb1887eb52a0ba3f4fe894bec96edb "feat(skills): add skill-comply — automated behavioral compliance measurement (#724) * feat(skills): add skill-comply — automated behavioral compliance measurement Automated compliance measurement for skills, rules, and agent definitions. Generates behavioral specs, runs scenarios at 3 strictness levels, classifies tool calls via LLM, and produces self-contained reports. Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com> * fix(skill-comply): address bot review feedback - AGENTS.md: fix stale skill count (115 → 117) in project structure - run.py: replace remaining print() with logger, add zero-division guard, create parent dirs for --output path - runner.py: add returncode check for claude subprocess, clarify relative_to path traversal validation - parser.py: use is_file() instead of exists(), catch KeyError for missing trace fields, add file check in parse_spec - classifier.py: log warnings on malformed classification output, guard against non-dict JSON responses - grader.py: filter negative indices from LLM classification Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com> --------- Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>") | Mar 23, 2026 |
| [tests](https://github.com/affaan-m/everything-claude-code/tree/main/tests "tests") | [tests](https://github.com/affaan-m/everything-claude-code/tree/main/tests "tests") | [feat(session): add worker health alongside state in ecc.session.v1 (](https://github.com/affaan-m/everything-claude-code/commit/401dca07d0bd42778e7c1ec8b4b553b2fc121e08 "feat(session): add worker health alongside state in ecc.session.v1 (#751)")[#751](https://github.com/affaan-m/everything-claude-code/pull/751) | Mar 22, 2026 |
| [.env.example](https://github.com/affaan-m/everything-claude-code/blob/main/.env.example ".env.example") | [.env.example](https://github.com/affaan-m/everything-claude-code/blob/main/.env.example ".env.example") | [chore(config): governance and config foundation (](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)")[#292](https://github.com/affaan-m/everything-claude-code/pull/292)[)](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)") | Mar 16, 2026 |
| [.gitignore](https://github.com/affaan-m/everything-claude-code/blob/main/.gitignore ".gitignore") | [.gitignore](https://github.com/affaan-m/everything-claude-code/blob/main/.gitignore ".gitignore") | [docs: publish The Shorthand Guide to Everything Agentic Security](https://github.com/affaan-m/everything-claude-code/commit/c1847bec5da83fe57eb61129bd3fd21e97ec9808 "docs: publish The Shorthand Guide to Everything Agentic Security Full article with embedded images: attack chain diagram, sandboxing comparison, sanitization visual, observability logging, ghostyy overflow. Tweet quotes from @TalBeerySec, @HedgieMarkets, @blackorbird formatted as blockquotes. Stats table fixed. Code blocks tagged. Links to shorthand and longform guides at bottom.") | Mar 21, 2026 |
| [.markdownlint.json](https://github.com/affaan-m/everything-claude-code/blob/main/.markdownlint.json ".markdownlint.json") | [.markdownlint.json](https://github.com/affaan-m/everything-claude-code/blob/main/.markdownlint.json ".markdownlint.json") | [chore(config): governance and config foundation (](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)")[#292](https://github.com/affaan-m/everything-claude-code/pull/292)[)](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)") | Mar 16, 2026 |
| [.npmignore](https://github.com/affaan-m/everything-claude-code/blob/main/.npmignore ".npmignore") | [.npmignore](https://github.com/affaan-m/everything-claude-code/blob/main/.npmignore ".npmignore") | [chore: rename opencode plugin to ecc-universal and add .npmignore](https://github.com/affaan-m/everything-claude-code/commit/b7519cb5458cfa6715785a09786ea8ab38c71b53 "chore: rename opencode plugin to ecc-universal and add .npmignore - Rename opencode-ecc to ecc-universal across package.json, index.ts, README.md, and MIGRATION.md for consistent branding - Add .npmignore to exclude translation READMEs, release scripts, and plugin dev notes from npm package") | Feb 12, 2026 |
| [.prettierrc](https://github.com/affaan-m/everything-claude-code/blob/main/.prettierrc ".prettierrc") | [.prettierrc](https://github.com/affaan-m/everything-claude-code/blob/main/.prettierrc ".prettierrc") | [chore: add .prettierrc for consistent code formatting](https://github.com/affaan-m/everything-claude-code/commit/66143eaf74dfc85c7719a41302c6421dfa461bbb "chore: add .prettierrc for consistent code formatting The post-edit-format hook runs Prettier on JS/TS files after edits, but without a project-level config it applied default settings (double quotes, etc.) that conflicted with the existing code style. Adding .prettierrc ensures the hook respects the project conventions. Settings derived from existing codebase analysis: - singleQuote: true - trailingComma: none - arrowParens: avoid - printWidth: 200") | Mar 3, 2026 |
| [.tool-versions](https://github.com/affaan-m/everything-claude-code/blob/main/.tool-versions ".tool-versions") | [.tool-versions](https://github.com/affaan-m/everything-claude-code/blob/main/.tool-versions ".tool-versions") | [chore(config): governance and config foundation (](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)")[#292](https://github.com/affaan-m/everything-claude-code/pull/292)[)](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)") | Mar 16, 2026 |
| [AGENTS.md](https://github.com/affaan-m/everything-claude-code/blob/main/AGENTS.md "AGENTS.md") | [AGENTS.md](https://github.com/affaan-m/everything-claude-code/blob/main/AGENTS.md "AGENTS.md") | [feat(skills): add skill-comply — automated behavioral compliance meas…](https://github.com/affaan-m/everything-claude-code/commit/a2e465c74dfb1887eb52a0ba3f4fe894bec96edb "feat(skills): add skill-comply — automated behavioral compliance measurement (#724) * feat(skills): add skill-comply — automated behavioral compliance measurement Automated compliance measurement for skills, rules, and agent definitions. Generates behavioral specs, runs scenarios at 3 strictness levels, classifies tool calls via LLM, and produces self-contained reports. Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com> * fix(skill-comply): address bot review feedback - AGENTS.md: fix stale skill count (115 → 117) in project structure - run.py: replace remaining print() with logger, add zero-division guard, create parent dirs for --output path - runner.py: add returncode check for claude subprocess, clarify relative_to path traversal validation - parser.py: use is_file() instead of exists(), catch KeyError for missing trace fields, add file check in parse_spec - classifier.py: log warnings on malformed classification output, guard against non-dict JSON responses - grader.py: filter negative indices from LLM classification Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com> --------- Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>") | Mar 23, 2026 |
| [CHANGELOG.md](https://github.com/affaan-m/everything-claude-code/blob/main/CHANGELOG.md "CHANGELOG.md") | [CHANGELOG.md](https://github.com/affaan-m/everything-claude-code/blob/main/CHANGELOG.md "CHANGELOG.md") | [chore: prepare v1.9.0 release (](https://github.com/affaan-m/everything-claude-code/commit/29277ac273f294fd4804c35e43af9c8a5fc5ba9d "chore: prepare v1.9.0 release (#666) - Bump version to 1.9.0 in package.json, package-lock.json, .opencode/package.json - Add v1.9.0 changelog with 212 commits covering selective install architecture, 6 new agents, 15+ new skills, session/state infrastructure, observer fixes, 12 language ecosystems, and community contributions - Update README with v1.9.0 release notes and complete agents tree (27 agents) - Add pytorch-build-resolver to AGENTS.md agent table - Update documentation counts to 27 agents, 109 skills, 57 commands - Update version references in zh-CN README - All 1421 tests passing, catalog counts verified")[#666](https://github.com/affaan-m/everything-claude-code/pull/666)[)](https://github.com/affaan-m/everything-claude-code/commit/29277ac273f294fd4804c35e43af9c8a5fc5ba9d "chore: prepare v1.9.0 release (#666) - Bump version to 1.9.0 in package.json, package-lock.json, .opencode/package.json - Add v1.9.0 changelog with 212 commits covering selective install architecture, 6 new agents, 15+ new skills, session/state infrastructure, observer fixes, 12 language ecosystems, and community contributions - Update README with v1.9.0 release notes and complete agents tree (27 agents) - Add pytorch-build-resolver to AGENTS.md agent table - Update documentation counts to 27 agents, 109 skills, 57 commands - Update version references in zh-CN README - All 1421 tests passing, catalog counts verified") | Mar 20, 2026 |
| [CLAUDE.md](https://github.com/affaan-m/everything-claude-code/blob/main/CLAUDE.md "CLAUDE.md") | [CLAUDE.md](https://github.com/affaan-m/everything-claude-code/blob/main/CLAUDE.md "CLAUDE.md") | [feat: define skill placement and provenance policy (](https://github.com/affaan-m/everything-claude-code/commit/4df960c9d5b58f27fb5e617f5da452ec63e9ae4e "feat: define skill placement and provenance policy (#748)")[#748](https://github.com/affaan-m/everything-claude-code/pull/748)[)](https://github.com/affaan-m/everything-claude-code/commit/4df960c9d5b58f27fb5e617f5da452ec63e9ae4e "feat: define skill placement and provenance policy (#748)") | Mar 22, 2026 |
| [CODE_OF_CONDUCT.md](https://github.com/affaan-m/everything-claude-code/blob/main/CODE_OF_CONDUCT.md "CODE_OF_CONDUCT.md") | [CODE_OF_CONDUCT.md](https://github.com/affaan-m/everything-claude-code/blob/main/CODE_OF_CONDUCT.md "CODE_OF_CONDUCT.md") | [Fix markdownlint errors from merge of affaan-m:main into main](https://github.com/affaan-m/everything-claude-code/commit/b0bc3dc0c9dc60774d937bb4fa50ce3cb8a4ec27 "Fix markdownlint errors from merge of affaan-m:main into main Co-authored-by: pangerlkr <73515951+pangerlkr@users.noreply.github.com>") | Mar 12, 2026 |
| [CONTRIBUTING.md](https://github.com/affaan-m/everything-claude-code/blob/main/CONTRIBUTING.md "CONTRIBUTING.md") | [CONTRIBUTING.md](https://github.com/affaan-m/everything-claude-code/blob/main/CONTRIBUTING.md "CONTRIBUTING.md") | [feat(commands): add /docs; feat(mcp-configs): document Context7 (](https://github.com/affaan-m/everything-claude-code/commit/888132263dd70075d509bed529de8fac9c0ba2c5 "feat(commands): add /docs; feat(mcp-configs): document Context7 (#530) * feat(commands): add /docs; feat(agents): add docs-lookup; feat(mcp-configs): document Context7; docs: add MCP subsection to CONTRIBUTING Made-with: Cursor * fix: address PR review — use Context7 MCP tool names in docs-lookup agent; CONTRIBUTING Agent Fields + MCP wording; mcp-config description; /docs quoted example; treat fetched docs as untrusted Made-with: Cursor * docs-lookup: note that harness may expose Context7 tools under prefixed names Made-with: Cursor * docs-lookup: examples use prefixed tool names (mcp__context7__*) for resolution Made-with: Cursor")[#530](https://github.com/affaan-m/everything-claude-code/pull/530)[)](https://github.com/affaan-m/everything-claude-code/commit/888132263dd70075d509bed529de8fac9c0ba2c5 "feat(commands): add /docs; feat(mcp-configs): document Context7 (#530) * feat(commands): add /docs; feat(agents): add docs-lookup; feat(mcp-configs): document Context7; docs: add MCP subsection to CONTRIBUTING Made-with: Cursor * fix: address PR review — use Context7 MCP tool names in docs-lookup agent; CONTRIBUTING Agent Fields + MCP wording; mcp-config description; /docs quoted example; treat fetched docs as untrusted Made-with: Cursor * docs-lookup: note that harness may expose Context7 tools under prefixed names Made-with: Cursor * docs-lookup: examples use prefixed tool names (mcp__context7__*) for resolution Made-with: Cursor") | Mar 16, 2026 |
| [LICENSE](https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE "LICENSE") | [LICENSE](https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE "LICENSE") | [docs: add missing MIT LICENSE file](https://github.com/affaan-m/everything-claude-code/commit/01ad21b1d44b1b1cffd413d907e52a44c6c8efd4 "docs: add missing MIT LICENSE file") | Jan 26, 2026 |
| [README.md](https://github.com/affaan-m/everything-claude-code/blob/main/README.md "README.md") | [README.md](https://github.com/affaan-m/everything-claude-code/blob/main/README.md "README.md") | [feat(skills): add skill-comply — automated behavioral compliance meas…](https://github.com/affaan-m/everything-claude-code/commit/a2e465c74dfb1887eb52a0ba3f4fe894bec96edb "feat(skills): add skill-comply — automated behavioral compliance measurement (#724) * feat(skills): add skill-comply — automated behavioral compliance measurement Automated compliance measurement for skills, rules, and agent definitions. Generates behavioral specs, runs scenarios at 3 strictness levels, classifies tool calls via LLM, and produces self-contained reports. Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com> * fix(skill-comply): address bot review feedback - AGENTS.md: fix stale skill count (115 → 117) in project structure - run.py: replace remaining print() with logger, add zero-division guard, create parent dirs for --output path - runner.py: add returncode check for claude subprocess, clarify relative_to path traversal validation - parser.py: use is_file() instead of exists(), catch KeyError for missing trace fields, add file check in parse_spec - classifier.py: log warnings on malformed classification output, guard against non-dict JSON responses - grader.py: filter negative indices from LLM classification Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com> --------- Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>") | Mar 23, 2026 |
| [README.zh-CN.md](https://github.com/affaan-m/everything-claude-code/blob/main/README.zh-CN.md "README.zh-CN.md") | [README.zh-CN.md](https://github.com/affaan-m/everything-claude-code/blob/main/README.zh-CN.md "README.zh-CN.md") | [Merge pull request](https://github.com/affaan-m/everything-claude-code/commit/cc9b11d1634b3403d11fb48bec0791e278e76737 "Merge pull request #392 from hahmee/docs/add-korean-translation Docs/add korean translation")[#392](https://github.com/affaan-m/everything-claude-code/pull/392)[from hahmee/docs/add-korean-translation](https://github.com/affaan-m/everything-claude-code/commit/cc9b11d1634b3403d11fb48bec0791e278e76737 "Merge pull request #392 from hahmee/docs/add-korean-translation Docs/add korean translation") | Mar 13, 2026 |
| [SECURITY.md](https://github.com/affaan-m/everything-claude-code/blob/main/SECURITY.md "SECURITY.md") | [SECURITY.md](https://github.com/affaan-m/everything-claude-code/blob/main/SECURITY.md "SECURITY.md") | [docs: add SECURITY.md, publish agentic security guide, remove opencla…](https://github.com/affaan-m/everything-claude-code/commit/fc4e5d654bcc7ef453d23b69d450522708e8df16 "docs: add SECURITY.md, publish agentic security guide, remove openclaw guide - Add SECURITY.md with vulnerability reporting policy - Publish \"The Shorthand Guide to Everything Agentic Security\" with attack vectors, sandboxing, sanitization, CVEs, and AgentShield coverage - Add security guide to README guides section (3-column layout) - Remove unpublished openclaw guide - Copy security article images to assets/images/security/") | Mar 21, 2026 |
| [SPONSORING.md](https://github.com/affaan-m/everything-claude-code/blob/main/SPONSORING.md "SPONSORING.md") | [SPONSORING.md](https://github.com/affaan-m/everything-claude-code/blob/main/SPONSORING.md "SPONSORING.md") | [docs: add sponsorship playbook and monthly metrics automation](https://github.com/affaan-m/everything-claude-code/commit/5fe40f4a6352ce263d0fa9fc954adbaf6bfec051 "docs: add sponsorship playbook and monthly metrics automation") | Mar 5, 2026 |
| [SPONSORS.md](https://github.com/affaan-m/everything-claude-code/blob/main/SPONSORS.md "SPONSORS.md") | [SPONSORS.md](https://github.com/affaan-m/everything-claude-code/blob/main/SPONSORS.md "SPONSORS.md") | [docs: strengthen sponsor optics with live metrics and tiers](https://github.com/affaan-m/everything-claude-code/commit/c4a5a69dbd3e24ff7989f8521536c06e60e99de4 "docs: strengthen sponsor optics with live metrics and tiers") | Mar 4, 2026 |
| [TROUBLESHOOTING.md](https://github.com/affaan-m/everything-claude-code/blob/main/TROUBLESHOOTING.md "TROUBLESHOOTING.md") | [TROUBLESHOOTING.md](https://github.com/affaan-m/everything-claude-code/blob/main/TROUBLESHOOTING.md "TROUBLESHOOTING.md") | [docs: tighten troubleshooting safety guidance](https://github.com/affaan-m/everything-claude-code/commit/5644415767ee692809dd3ae2f9bc929b70f16865 "docs: tighten troubleshooting safety guidance") | Mar 11, 2026 |
| [VERSION](https://github.com/affaan-m/everything-claude-code/blob/main/VERSION "VERSION") | [VERSION](https://github.com/affaan-m/everything-claude-code/blob/main/VERSION "VERSION") | [chore(config): governance and config foundation (](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)")[#292](https://github.com/affaan-m/everything-claude-code/pull/292)[)](https://github.com/affaan-m/everything-claude-code/commit/3b2e1745e9cc571b56cc0eb02a4e076c77d97a99 "chore(config): governance and config foundation (#292) * chore(config): governance and config foundation (PR #272 split 1/6) Add repository governance and configuration files: - CODEOWNERS: review authority model - ISSUE_TEMPLATE: Copilot task template - PULL_REQUEST_TEMPLATE: comprehensive review checklist - .env.example: environment variable documentation - .tool-versions: asdf/mise compatibility (Node 20, Python 3.12) - .gitignore: expanded coverage (build, test, Python, tmp) - .markdownlint.json: add MD009 trailing whitespace rule - VERSION: 0.1.0 This is PR 1 of 6 from the PR #272 decomposition plan. Dependency chain: PR-1 → PR-2 → PR-3 → PR-4/5/6 (parallel) * chore(config): remove fork-specific CODEOWNERS from upstream PR CODEOWNERS references @alfraido86-jpg (fork owner). Submitting this to upstream would override @affaan-m's review authority. CODEOWNERS belongs in the fork only, not in upstream contributions. Ref: SAM finding F9 (run-048 audit) * chore: address CodeRabbit review feedback on PR #292 - Scope markdownlint config to repo files (globs pattern) - Add pre-commit hook checkbox to PR template Ref: CodeRabbit review on PR #292 * fix(config): address CodeRabbit nitpicks N2 and N3 N2: Move pre-commit hooks checkbox higher in security checklist. N3: Replace global MD009 disable with scoped config (br_spaces: 2). * fix(config): use recursive glob for node_modules exclusion (N4)") | Mar 16, 2026 |
| [commitlint.config.js](https://github.com/affaan-m/everything-claude-code/blob/main/commitlint.config.js "commitlint.config.js") | [commitlint.config.js](https://github.com/affaan-m/everything-claude-code/blob/main/commitlint.config.js "commitlint.config.js") | [feat: add comprehensive CI/CD pipeline](https://github.com/affaan-m/everything-claude-code/commit/7c0bc2598223bb6fc508a0ef853256574c38ac7e "feat: add comprehensive CI/CD pipeline Adds GitHub Actions workflows for CI, maintenance, and releases with multi-platform testing matrix.") | Jan 29, 2026 |
| [eslint.config.js](https://github.com/affaan-m/everything-claude-code/blob/main/eslint.config.js "eslint.config.js") | [eslint.config.js](https://github.com/affaan-m/everything-claude-code/blob/main/eslint.config.js "eslint.config.js") | [fix: add global ignores to ESLint config for dist and cursor dirs](https://github.com/affaan-m/everything-claude-code/commit/f56fb331ac3c3ba5b123a64a9b8ded40ee5575b1 "fix: add global ignores to ESLint config for dist and cursor dirs Prevent ESLint from parsing .opencode/dist/ (ES modules with sourceType: commonjs mismatch) and .cursor/ (duplicated files). Uses flat config global ignores pattern (standalone ignores object).") | Feb 12, 2026 |
| [install.ps1](https://github.com/affaan-m/everything-claude-code/blob/main/install.ps1 "install.ps1") | [install.ps1](https://github.com/affaan-m/everything-claude-code/blob/main/install.ps1 "install.ps1") | [Add PowerShell installer wrapper and update documentation (](https://github.com/affaan-m/everything-claude-code/commit/17a6ef4edbd50e8a1320f2ce1c903fa9c01f3e3d "Add PowerShell installer wrapper and update documentation (#532) * Add install.ps1 PowerShell wrapper and tests Add a Windows-native PowerShell wrapper (install.ps1) that resolves symlinks and delegates to the Node-based installer runtime. Update README with PowerShell usage examples and cross-platform npx entrypoint guidance. Point the ecc-install bin to the Node installer (scripts/install-apply.js) in package.json (and refresh package-lock), include install.ps1 in package files, and add tests: a new install-ps1.test.js and a tweak to install-sh.test.js to skip on Windows. These changes provide native Windows installer support while keeping npm-compatible cross-platform invocation. * Improve tests for Windows HOME/USERPROFILE Make tests more cross-platform by ensuring HOME and USERPROFILE are kept in sync and by normalizing test file paths for display. - tests/lib/session-adapters.test.js: set USERPROFILE when temporarily setting HOME and restore previous USERPROFILE on teardown. - tests/run-all.js: use a normalized displayPath (forward-slash separated) for logging and error messages so output is consistent across platforms. - tests/scripts/ecc.test.js & tests/scripts/session-inspect.test.js: build envOverrides from options.env and add HOME <-> USERPROFILE fallbacks so spawned child processes receive both variables when only one is provided. These changes prevent test failures and inconsistent logs on Windows where USERPROFILE is used instead of HOME. * Fix Windows paths and test flakiness Improve cross-platform behavior and test stability. - Remove unused createLegacyInstallPlan import from install-lifecycle.js. - Change resolveInstallConfigPath to use path.normalize(path.join(cwd, configPath)) to produce normalized relative paths. - Tests: add toBashPath and normalizedRelativePath helpers to normalize Windows paths for bash and comparisons. - Make cleanupTestDir retry rmSync on transient Windows errors (EPERM/EBUSY/ENOTEMPTY) with short backoff using sleepMs. - Ensure spawned test processes receive USERPROFILE and convert repo/detect paths to bash format when invoking bash. These changes reduce Windows-specific failures and flakiness in the test suite and tidy up a small unused import.")[#532](https://github.com/affaan-m/everything-claude-code/pull/532)[)](https://github.com/affaan-m/everything-claude-code/commit/17a6ef4edbd50e8a1320f2ce1c903fa9c01f3e3d "Add PowerShell installer wrapper and update documentation (#532) * Add install.ps1 PowerShell wrapper and tests Add a Windows-native PowerShell wrapper (install.ps1) that resolves symlinks and delegates to the Node-based installer runtime. Update README with PowerShell usage examples and cross-platform npx entrypoint guidance. Point the ecc-install bin to the Node installer (scripts/install-apply.js) in package.json (and refresh package-lock), include install.ps1 in package files, and add tests: a new install-ps1.test.js and a tweak to install-sh.test.js to skip on Windows. These changes provide native Windows installer support while keeping npm-compatible cross-platform invocation. * Improve tests for Windows HOME/USERPROFILE Make tests more cross-platform by ensuring HOME and USERPROFILE are kept in sync and by normalizing test file paths for display. - tests/lib/session-adapters.test.js: set USERPROFILE when temporarily setting HOME and restore previous USERPROFILE on teardown. - tests/run-all.js: use a normalized displayPath (forward-slash separated) for logging and error messages so output is consistent across platforms. - tests/scripts/ecc.test.js & tests/scripts/session-inspect.test.js: build envOverrides from options.env and add HOME <-> USERPROFILE fallbacks so spawned child processes receive both variables when only one is provided. These changes prevent test failures and inconsistent logs on Windows where USERPROFILE is used instead of HOME. * Fix Windows paths and test flakiness Improve cross-platform behavior and test stability. - Remove unused createLegacyInstallPlan import from install-lifecycle.js. - Change resolveInstallConfigPath to use path.normalize(path.join(cwd, configPath)) to produce normalized relative paths. - Tests: add toBashPath and normalizedRelativePath helpers to normalize Windows paths for bash and comparisons. - Make cleanupTestDir retry rmSync on transient Windows errors (EPERM/EBUSY/ENOTEMPTY) with short backoff using sleepMs. - Ensure spawned test processes receive USERPROFILE and convert repo/detect paths to bash format when invoking bash. These changes reduce Windows-specific failures and flakiness in the test suite and tidy up a small unused import.") | Mar 16, 2026 |
| [install.sh](https://github.com/affaan-m/everything-claude-code/blob/main/install.sh "install.sh") | [install.sh](https://github.com/affaan-m/everything-claude-code/blob/main/install.sh "install.sh") | [feat: orchestration harness, selective install, observer improvements](https://github.com/affaan-m/everything-claude-code/commit/4e028bd2d20cfc514a571aa7f91ff0639e55e7fc "feat: orchestration harness, selective install, observer improvements") | Mar 14, 2026 |
| [package-lock.json](https://github.com/affaan-m/everything-claude-code/blob/main/package-lock.json "package-lock.json") | [package-lock.json](https://github.com/affaan-m/everything-claude-code/blob/main/package-lock.json "package-lock.json") | [fix: safe Codex config sync — merge AGENTS.md + add-only MCP servers (](https://github.com/affaan-m/everything-claude-code/commit/09efd682284ffb8f3d9a0f4960fd382e0db94cda "fix: safe Codex config sync — merge AGENTS.md + add-only MCP servers (#723) * fix: replace bash TOML surgery with Node add-only MCP merge The old sync script used awk/sed to remove and re-append MCP server sections in config.toml, causing credential extraction races, duplicate TOML tables, and 3 fragile code paths with 9 remove_section_inplace calls each. Replace with a Node script (scripts/codex/merge-mcp-config.js) that uses @iarna/toml to parse the config, then appends only missing ECC servers — preserving all existing content byte-for-byte. Warns on config drift, supports legacy aliases (context7 → context7-mcp), and adds --update-mcp flag for explicit refresh. Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> * fix: address PR #723 review findings for Codex MCP merge - Use package-manager abstraction (scripts/lib/package-manager.js) instead of hardcoding pnpm — respects CLAUDE_PACKAGE_MANAGER, lock files, and project config - Add Yarn 1.x fallback to npx (yarn dlx unsupported in classic) - Add missing exa server to match .codex/config.toml baseline - Wire up findSubSections for --update-mcp nested subtable removal (fixes Greptile P1: Object.keys only returned top-level keys) - Fix resolvedLabel to prefer canonical entry over legacy alias when both exist (fixes context7/context7-mcp spurious warning) - Fix removeSectionFromText to handle inline TOML comments - Fix dry-run + --update-mcp to show removals before early return - Update README parity table: 4 → 7 servers, TOML-parser-based - Add non-npm install variants to README Codex quick start - Update package-lock.json for @iarna/toml Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> * fix: address PR #723 review comments (preflight, marker validation) - Add Node.js and merge-mcp-config.js to preflight checks so the script fails fast before partial writes (CodeRabbit) - Validate marker counts: require exactly 1 BEGIN + 1 END in correct order for clean replacement (CodeRabbit) - Corrupted markers: strip all marker lines and re-append fresh block, preserving user content outside markers instead of overwriting - Move MCP_MERGE_SCRIPT to preflight section, remove duplicate Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> --------- Co-authored-by: Claude <noreply@anthropic.com> Co-authored-by: Happy <yesreply@happy.engineering>")[#…](https://github.com/affaan-m/everything-claude-code/pull/723) | Mar 22, 2026 |
| [package.json](https://github.com/affaan-m/everything-claude-code/blob/main/package.json "package.json") | [package.json](https://github.com/affaan-m/everything-claude-code/blob/main/package.json "package.json") | [fix: safe Codex config sync — merge AGENTS.md + add-only MCP servers (](https://github.com/affaan-m/everything-claude-code/commit/09efd682284ffb8f3d9a0f4960fd382e0db94cda "fix: safe Codex config sync — merge AGENTS.md + add-only MCP servers (#723) * fix: replace bash TOML surgery with Node add-only MCP merge The old sync script used awk/sed to remove and re-append MCP server sections in config.toml, causing credential extraction races, duplicate TOML tables, and 3 fragile code paths with 9 remove_section_inplace calls each. Replace with a Node script (scripts/codex/merge-mcp-config.js) that uses @iarna/toml to parse the config, then appends only missing ECC servers — preserving all existing content byte-for-byte. Warns on config drift, supports legacy aliases (context7 → context7-mcp), and adds --update-mcp flag for explicit refresh. Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> * fix: address PR #723 review findings for Codex MCP merge - Use package-manager abstraction (scripts/lib/package-manager.js) instead of hardcoding pnpm — respects CLAUDE_PACKAGE_MANAGER, lock files, and project config - Add Yarn 1.x fallback to npx (yarn dlx unsupported in classic) - Add missing exa server to match .codex/config.toml baseline - Wire up findSubSections for --update-mcp nested subtable removal (fixes Greptile P1: Object.keys only returned top-level keys) - Fix resolvedLabel to prefer canonical entry over legacy alias when both exist (fixes context7/context7-mcp spurious warning) - Fix removeSectionFromText to handle inline TOML comments - Fix dry-run + --update-mcp to show removals before early return - Update README parity table: 4 → 7 servers, TOML-parser-based - Add non-npm install variants to README Codex quick start - Update package-lock.json for @iarna/toml Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> * fix: address PR #723 review comments (preflight, marker validation) - Add Node.js and merge-mcp-config.js to preflight checks so the script fails fast before partial writes (CodeRabbit) - Validate marker counts: require exactly 1 BEGIN + 1 END in correct order for clean replacement (CodeRabbit) - Corrupted markers: strip all marker lines and re-append fresh block, preserving user content outside markers instead of overwriting - Move MCP_MERGE_SCRIPT to preflight section, remove duplicate Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering) Co-Authored-By: Claude <noreply@anthropic.com> Co-Authored-By: Happy <yesreply@happy.engineering> --------- Co-authored-by: Claude <noreply@anthropic.com> Co-authored-by: Happy <yesreply@happy.engineering>")[#…](https://github.com/affaan-m/everything-claude-code/pull/723) | Mar 22, 2026 |
| [the-longform-guide.md](https://github.com/affaan-m/everything-claude-code/blob/main/the-longform-guide.md "the-longform-guide.md") | [the-longform-guide.md](https://github.com/affaan-m/everything-claude-code/blob/main/the-longform-guide.md "the-longform-guide.md") | [Fix markdownlint errors from merge of affaan-m:main into main](https://github.com/affaan-m/everything-claude-code/commit/b0bc3dc0c9dc60774d937bb4fa50ce3cb8a4ec27 "Fix markdownlint errors from merge of affaan-m:main into main Co-authored-by: pangerlkr <73515951+pangerlkr@users.noreply.github.com>") | Mar 12, 2026 |
| [the-security-guide.md](https://github.com/affaan-m/everything-claude-code/blob/main/the-security-guide.md "the-security-guide.md") | [the-security-guide.md](https://github.com/affaan-m/everything-claude-code/blob/main/the-security-guide.md "the-security-guide.md") | [docs: publish The Shorthand Guide to Everything Agentic Security](https://github.com/affaan-m/everything-claude-code/commit/c1847bec5da83fe57eb61129bd3fd21e97ec9808 "docs: publish The Shorthand Guide to Everything Agentic Security Full article with embedded images: attack chain diagram, sandboxing comparison, sanitization visual, observability logging, ghostyy overflow. Tweet quotes from @TalBeerySec, @HedgieMarkets, @blackorbird formatted as blockquotes. Stats table fixed. Code blocks tagged. Links to shorthand and longform guides at bottom.") | Mar 21, 2026 |
| [the-shortform-guide.md](https://github.com/affaan-m/everything-claude-code/blob/main/the-shortform-guide.md "the-shortform-guide.md") | [the-shortform-guide.md](https://github.com/affaan-m/everything-claude-code/blob/main/the-shortform-guide.md "the-shortform-guide.md") | [Fix markdownlint errors from merge of affaan-m:main into main](https://github.com/affaan-m/everything-claude-code/commit/b0bc3dc0c9dc60774d937bb4fa50ce3cb8a4ec27 "Fix markdownlint errors from merge of affaan-m:main into main Co-authored-by: pangerlkr <73515951+pangerlkr@users.noreply.github.com>") | Mar 12, 2026 |
| View all files |

## Repository files navigation

*   [README](https://github.com/affaan-m/everything-claude-code#)
*   [Code of conduct](https://github.com/affaan-m/everything-claude-code#)
*   [Contributing](https://github.com/affaan-m/everything-claude-code#)
*   [MIT license](https://github.com/affaan-m/everything-claude-code#)
*   [Security](https://github.com/affaan-m/everything-claude-code#)

**Language:** English | [Português (Brasil)](https://github.com/affaan-m/everything-claude-code/blob/main/docs/pt-BR/README.md) | [简体中文](https://github.com/affaan-m/everything-claude-code/blob/main/README.zh-CN.md) | [繁體中文](https://github.com/affaan-m/everything-claude-code/blob/main/docs/zh-TW/README.md) | [日本語](https://github.com/affaan-m/everything-claude-code/blob/main/docs/ja-JP/README.md) | [한국어](https://github.com/affaan-m/everything-claude-code/blob/main/docs/ko-KR/README.md)[Türkçe](https://github.com/affaan-m/everything-claude-code/blob/main/docs/tr/README.md)

# Everything Claude Code

[](https://github.com/affaan-m/everything-claude-code#everything-claude-code)

[![Image 4: Stars](https://camo.githubusercontent.com/bd8bf260a43dea1e1e2b2bf3445cbe99146e6d5dd4fd6a3d3d4a36ea6b086119/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f73746172732f61666661616e2d6d2f65766572797468696e672d636c617564652d636f64653f7374796c653d666c6174)](https://github.com/affaan-m/everything-claude-code/stargazers)[![Image 5: Forks](https://camo.githubusercontent.com/e9fcde3f38c29a0912ba59aaa658427da40623c667b0ffa1c2f0a365bc021999/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f666f726b732f61666661616e2d6d2f65766572797468696e672d636c617564652d636f64653f7374796c653d666c6174)](https://github.com/affaan-m/everything-claude-code/network/members)[![Image 6: Contributors](https://camo.githubusercontent.com/24ab28115295fa646167b15006760da6a234214f72ca3397dabd6eb3a40103c4/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f636f6e7472696275746f72732f61666661616e2d6d2f65766572797468696e672d636c617564652d636f64653f7374796c653d666c6174)](https://github.com/affaan-m/everything-claude-code/graphs/contributors)[![Image 7: npm ecc-universal](https://camo.githubusercontent.com/47fd911de57265a968e4165c8e0bbebc20c2ce62b636edd6008a585b44ecd404/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f64772f6563632d756e6976657273616c3f6c6162656c3d6563632d756e6976657273616c2532307765656b6c79253230646f776e6c6f616473266c6f676f3d6e706d)](https://www.npmjs.com/package/ecc-universal)[![Image 8: npm ecc-agentshield](https://camo.githubusercontent.com/74b8bb5c17964a9a0e92dff3f47a8da9262c3d212d2cb6e6f2d852dcf2758ebb/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f64772f6563632d6167656e74736869656c643f6c6162656c3d6563632d6167656e74736869656c642532307765656b6c79253230646f776e6c6f616473266c6f676f3d6e706d)](https://www.npmjs.com/package/ecc-agentshield)[![Image 9: GitHub App Install](https://camo.githubusercontent.com/ba16ba26bcd7ffae77ea785ec304580ad59a3c742fdf539a40af3ffd0fed361a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4769744875622532304170702d313530253230696e7374616c6c732d3265613434663f6c6f676f3d676974687562)](https://github.com/marketplace/ecc-tools)[![Image 10: License](https://camo.githubusercontent.com/7013272bd27ece47364536a221edb554cd69683b68a46fc0ee96881174c4214c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6c6963656e73652d4d49542d626c75652e737667)](https://github.com/affaan-m/everything-claude-code/blob/main/LICENSE)[![Image 11: Shell](https://camo.githubusercontent.com/47d7f79e8524602f5b32c57347c8302258c70edb254c31655ab99452165cfcc0/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d5368656c6c2d3445414132353f6c6f676f3d676e752d62617368266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/47d7f79e8524602f5b32c57347c8302258c70edb254c31655ab99452165cfcc0/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d5368656c6c2d3445414132353f6c6f676f3d676e752d62617368266c6f676f436f6c6f723d7768697465)[![Image 12: TypeScript](https://camo.githubusercontent.com/10350e1c35e1cdfee8ae471db125c23bd37448d6fec75b7baf39edb6f351482a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d547970655363726970742d3331373843363f6c6f676f3d74797065736372697074266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/10350e1c35e1cdfee8ae471db125c23bd37448d6fec75b7baf39edb6f351482a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d547970655363726970742d3331373843363f6c6f676f3d74797065736372697074266c6f676f436f6c6f723d7768697465)[![Image 13: Python](https://camo.githubusercontent.com/75f630e9fdd61ed09f6651d5e22192b7b90dd55b80d52f70145b2f5e693e6197/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d507974686f6e2d3337373641423f6c6f676f3d707974686f6e266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/75f630e9fdd61ed09f6651d5e22192b7b90dd55b80d52f70145b2f5e693e6197/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d507974686f6e2d3337373641423f6c6f676f3d707974686f6e266c6f676f436f6c6f723d7768697465)[![Image 14: Go](https://camo.githubusercontent.com/166dcd0f9ef7af21be18a1c8b5a39b1c8bf5aa881032a24e0fa1f566196d6a92/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d476f2d3030414444383f6c6f676f3d676f266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/166dcd0f9ef7af21be18a1c8b5a39b1c8bf5aa881032a24e0fa1f566196d6a92/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d476f2d3030414444383f6c6f676f3d676f266c6f676f436f6c6f723d7768697465)[![Image 15: Java](https://camo.githubusercontent.com/79f88e1f86ed963337905d6efe3a263af5f2e297b3f2f2a51f2dbc95f77d64aa/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d4a6176612d4544384230303f6c6f676f3d6f70656e6a646b266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/79f88e1f86ed963337905d6efe3a263af5f2e297b3f2f2a51f2dbc95f77d64aa/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d4a6176612d4544384230303f6c6f676f3d6f70656e6a646b266c6f676f436f6c6f723d7768697465)[![Image 16: Perl](https://camo.githubusercontent.com/5b8542cc58a252055e3d55d8d08c6164afad743f44b05a6d0b1bd1d3979f6743/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d5065726c2d3339343537453f6c6f676f3d7065726c266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/5b8542cc58a252055e3d55d8d08c6164afad743f44b05a6d0b1bd1d3979f6743/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d5065726c2d3339343537453f6c6f676f3d7065726c266c6f676f436f6c6f723d7768697465)[![Image 17: Markdown](https://camo.githubusercontent.com/7ccf587ad1350a6018f00f16cfa83000bbc186e4f713e0fd63ed79f43dd6e1d9/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d4d61726b646f776e2d3030303030303f6c6f676f3d6d61726b646f776e266c6f676f436f6c6f723d7768697465)](https://camo.githubusercontent.com/7ccf587ad1350a6018f00f16cfa83000bbc186e4f713e0fd63ed79f43dd6e1d9/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f2d4d61726b646f776e2d3030303030303f6c6f676f3d6d61726b646f776e266c6f676f436f6c6f723d7768697465)

> **50K+ stars** | **6K+ forks** | **30 contributors** | **7 languages supported** | **Anthropic Hackathon Winner**

* * *

**🌐 Language / 语言 / 語言 / Dil**

[**English**](https://github.com/affaan-m/everything-claude-code/blob/main/README.md) | [Português (Brasil)](https://github.com/affaan-m/everything-claude-code/blob/main/docs/pt-BR/README.md) | [简体中文](https://github.com/affaan-m/everything-claude-code/blob/main/README.zh-CN.md) | [繁體中文](https://github.com/affaan-m/everything-claude-code/blob/main/docs/zh-TW/README.md) | [日本語](https://github.com/affaan-m/everything-claude-code/blob/main/docs/ja-JP/README.md) | [한국어](https://github.com/affaan-m/everything-claude-code/blob/main/docs/ko-KR/README.md) | [Türkçe](https://github.com/affaan-m/everything-claude-code/blob/main/docs/tr/README.md)

* * *

**The performance optimization system for AI agent harnesses. From an Anthropic hackathon winner.**

Not just configs. A complete system: skills, instincts, memory optimization, continuous learning, security scanning, and research-first development. Production-ready agents, hooks, commands, rules, and MCP configurations evolved over 10+ months of intensive daily use building real products.

Works across **Claude Code**, **Codex**, **Cowork**, and other AI agent harnesses.

* * *

## The Guides

[](https://github.com/affaan-m/everything-claude-code#the-guides)

This repo is the raw code only. The guides explain everything.

[![Image 18: The Shorthand Guide to Everything Claude Code](https://github.com/affaan-m/everything-claude-code/raw/main/assets/images/guides/shorthand-guide.png)](https://x.com/affaanmustafa/status/2012378465664745795)[![Image 19: The Longform Guide to Everything Claude Code](https://github.com/affaan-m/everything-claude-code/raw/main/assets/images/guides/longform-guide.png)](https://x.com/affaanmustafa/status/2014040193557471352)[![Image 20: The Shorthand Guide to Everything Agentic Security](https://github.com/affaan-m/everything-claude-code/raw/main/assets/images/security/security-guide-header.png)](https://x.com/affaanmustafa/status/2033263813387223421)
**Shorthand Guide**

Setup, foundations, philosophy. **Read this first.****Longform Guide**

Token optimization, memory persistence, evals, parallelization.**Security Guide**

Attack vectors, sandboxing, sanitization, CVEs, AgentShield.

| Topic | What You'll Learn |
| --- | --- |
| Token Optimization | Model selection, system prompt slimming, background processes |
| Memory Persistence | Hooks that save/load context across sessions automatically |
| Continuous Learning | Auto-extract patterns from sessions into reusable skills |
| Verification Loops | Checkpoint vs continuous evals, grader types, pass@k metrics |
| Parallelization | Git worktrees, cascade method, when to scale instances |
| Subagent Orchestration | The context problem, iterative retrieval pattern |

* * *

## What's New

[](https://github.com/affaan-m/everything-claude-code#whats-new)

### v1.9.0 — Selective Install & Language Expansion (Mar 2026)

[](https://github.com/affaan-m/everything-claude-code#v190--selective-install--language-expansion-mar-2026)

*   **Selective install architecture** — Manifest-driven install pipeline with `install-plan.js` and `install-apply.js` for targeted component installation. State store tracks what's installed and enables incremental updates.
*   **6 new agents** — `typescript-reviewer`, `pytorch-build-resolver`, `java-build-resolver`, `java-reviewer`, `kotlin-reviewer`, `kotlin-build-resolver` expand language coverage to 10 languages.
*   **New skills** — `pytorch-patterns` for deep learning workflows, `documentation-lookup` for API reference research, `bun-runtime` and `nextjs-turbopack` for modern JS toolchains, plus 8 operational domain skills and `mcp-server-patterns`.
*   **Session & state infrastructure** — SQLite state store with query CLI, session adapters for structured recording, skill evolution foundation for self-improving skills.
*   **Orchestration overhaul** — Harness audit scoring made deterministic, orchestration status and launcher compatibility hardened, observer loop prevention with 5-layer guard.
*   **Observer reliability** — Memory explosion fix with throttling and tail sampling, sandbox access fix, lazy-start logic, and re-entrancy guard.
*   **12 language ecosystems** — New rules for Java, PHP, Perl, Kotlin/Android/KMP, C++, and Rust join existing TypeScript, Python, Go, and common rules.
*   **Community contributions** — Korean and Chinese translations, security hook, biome hook optimization, video processing skills, operational skills, PowerShell installer, Antigravity IDE support.
*   **CI hardening** — 19 test failure fixes, catalog count enforcement, install manifest validation, and full test suite green.

### v1.8.0 — Harness Performance System (Mar 2026)

[](https://github.com/affaan-m/everything-claude-code#v180--harness-performance-system-mar-2026)

*   **Harness-first release** — ECC is now explicitly framed as an agent harness performance system, not just a config pack.
*   **Hook reliability overhaul** — SessionStart root fallback, Stop-phase session summaries, and script-based hooks replacing fragile inline one-liners.
*   **Hook runtime controls** — `ECC_HOOK_PROFILE=minimal|standard|strict` and `ECC_DISABLED_HOOKS=...` for runtime gating without editing hook files.
*   **New harness commands** — `/harness-audit`, `/loop-start`, `/loop-status`, `/quality-gate`, `/model-route`.
*   **NanoClaw v2** — model routing, skill hot-load, session branch/search/export/compact/metrics.
*   **Cross-harness parity** — behavior tightened across Claude Code, Cursor, OpenCode, and Codex app/CLI.
*   **997 internal tests passing** — full suite green after hook/runtime refactor and compatibility updates.

### v1.7.0 — Cross-Platform Expansion & Presentation Builder (Feb 2026)

[](https://github.com/affaan-m/everything-claude-code#v170--cross-platform-expansion--presentation-builder-feb-2026)

*   **Codex app + CLI support** — Direct `AGENTS.md`-based Codex support, installer targeting, and Codex docs
*   **`frontend-slides` skill** — Zero-dependency HTML presentation builder with PPTX conversion guidance and strict viewport-fit rules
*   **5 new generic business/content skills** — `article-writing`, `content-engine`, `market-research`, `investor-materials`, `investor-outreach`
*   **Broader tool coverage** — Cursor, Codex, and OpenCode support tightened so the same repo ships cleanly across all major harnesses
*   **992 internal tests** — Expanded validation and regression coverage across plugin, hooks, skills, and packaging

### v1.6.0 — Codex CLI, AgentShield & Marketplace (Feb 2026)

[](https://github.com/affaan-m/everything-claude-code#v160--codex-cli-agentshield--marketplace-feb-2026)

*   **Codex CLI support** — New `/codex-setup` command generates `codex.md` for OpenAI Codex CLI compatibility
*   **7 new skills** — `search-first`, `swift-actor-persistence`, `swift-protocol-di-testing`, `regex-vs-llm-structured-text`, `content-hash-cache-pattern`, `cost-aware-llm-pipeline`, `skill-stocktake`
*   **AgentShield integration** — `/security-scan` skill runs AgentShield directly from Claude Code; 1282 tests, 102 rules
*   **GitHub Marketplace** — ECC Tools GitHub App live at [github.com/marketplace/ecc-tools](https://github.com/marketplace/ecc-tools) with free/pro/enterprise tiers
*   **30+ community PRs merged** — Contributions from 30 contributors across 6 languages
*   **978 internal tests** — Expanded validation suite across agents, skills, commands, hooks, and rules

### v1.4.1 — Bug Fix (Feb 2026)

[](https://github.com/affaan-m/everything-claude-code#v141--bug-fix-feb-2026)

*   **Fixed instinct import content loss** — `parse_instinct_file()` was silently dropping all content after frontmatter (Action, Evidence, Examples sections) during `/instinct-import`. ([#148](https://github.com/affaan-m/everything-claude-code/issues/148), [#161](https://github.com/affaan-m/everything-claude-code/pull/161))

### v1.4.0 — Multi-Language Rules, Installation Wizard & PM2 (Feb 2026)

[](https://github.com/affaan-m/everything-claude-code#v140--multi-language-rules-installation-wizard--pm2-feb-2026)

*   **Interactive installation wizard** — New `configure-ecc` skill provides guided setup with merge/overwrite detection
*   **PM2 & multi-agent orchestration** — 6 new commands (`/pm2`, `/multi-plan`, `/multi-execute`, `/multi-backend`, `/multi-frontend`, `/multi-workflow`) for managing complex multi-service workflows
*   **Multi-language rules architecture** — Rules restructured from flat files into `common/` + `typescript/` + `python/` + `golang/` directories. Install only the languages you need
*   **Chinese (zh-CN) translations** — Complete translation of all agents, commands, skills, and rules (80+ files)
*   **GitHub Sponsors support** — Sponsor the project via GitHub Sponsors
*   **Enhanced CONTRIBUTING.md** — Detailed PR templates for each contribution type

### v1.3.0 — OpenCode Plugin Support (Feb 2026)

[](https://github.com/affaan-m/everything-claude-code#v130--opencode-plugin-support-feb-2026)

*   **Full OpenCode integration** — 12 agents, 24 commands, 16 skills with hook support via OpenCode's plugin system (20+ event types)
*   **3 native custom tools** — run-tests, check-coverage, security-audit
*   **LLM documentation** — `llms.txt` for comprehensive OpenCode docs

### v1.2.0 — Unified Commands & Skills (Feb 2026)

[](https://github.com/affaan-m/everything-claude-code#v120--unified-commands--skills-feb-2026)

*   **Python/Django support** — Django patterns, security, TDD, and verification skills
*   **Java Spring Boot skills** — Patterns, security, TDD, and verification for Spring Boot
*   **Session management** — `/sessions` command for session history
*   **Continuous learning v2** — Instinct-based learning with confidence scoring, import/export, evolution

See the full changelog in [Releases](https://github.com/affaan-m/everything-claude-code/releases).

* * *

## 🚀 Quick Start

[](https://github.com/affaan-m/everything-claude-code#-quick-start)

Get up and running in under 2 minutes:

### Step 1: Install the Plugin

[](https://github.com/affaan-m/everything-claude-code#step-1-install-the-plugin)

undefinedshell
# Add marketplace
/plugin marketplace add affaan-m/everything-claude-code

# Install plugin
/plugin install everything-claude-code@everything-claude-code
undefined

### Step 2: Install Rules (Required)

[](https://github.com/affaan-m/everything-claude-code#step-2-install-rules-required)

> ⚠️**Important:** Claude Code plugins cannot distribute `rules` automatically. Install them manually:

undefinedshell
# Clone the repo first
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# Install dependencies (pick your package manager)
npm install        # or: pnpm install | yarn install | bun install

# macOS/Linux
./install.sh typescript    # or python or golang or swift or php
# ./install.sh typescript python golang swift php
# ./install.sh --target cursor typescript
# ./install.sh --target antigravity typescript
undefined

undefinedpowershell
# Windows PowerShell
.\install.ps1 typescript   # or python or golang or swift or php
# .\install.ps1 typescript python golang swift php
# .\install.ps1 --target cursor typescript
# .\install.ps1 --target antigravity typescript

# npm-installed compatibility entrypoint also works cross-platform
npx ecc-install typescript
undefined

For manual install instructions see the README in the `rules/` folder.

### Step 3: Start Using

[](https://github.com/affaan-m/everything-claude-code#step-3-start-using)

undefinedshell
# Try a command (plugin install uses namespaced form)
/everything-claude-code:plan "Add user authentication"

# Manual install (Option 2) uses the shorter form:
# /plan "Add user authentication"

# Check available commands
/plugin list everything-claude-code@everything-claude-code
undefined

✨ **That's it!** You now have access to 28 agents, 119 skills, and 60 commands.

* * *

## 🌐 Cross-Platform Support

[](https://github.com/affaan-m/everything-claude-code#-cross-platform-support)

This plugin now fully supports **Windows, macOS, and Linux**, alongside tight integration across major IDEs (Cursor, OpenCode, Antigravity) and CLI harnesses. All hooks and scripts have been rewritten in Node.js for maximum compatibility.

### Package Manager Detection

[](https://github.com/affaan-m/everything-claude-code#package-manager-detection)

The plugin automatically detects your preferred package manager (npm, pnpm, yarn, or bun) with the following priority:

1.   **Environment variable**: `CLAUDE_PACKAGE_MANAGER`
2.   **Project config**: `.claude/package-manager.json`
3.   **package.json**: `packageManager` field
4.   **Lock file**: Detection from package-lock.json, yarn.lock, pnpm-lock.yaml, or bun.lockb
5.   **Global config**: `~/.claude/package-manager.json`
6.   **Fallback**: First available package manager

To set your preferred package manager:

undefinedshell
# Via environment variable
export CLAUDE_PACKAGE_MANAGER=pnpm

# Via global config
node scripts/setup-package-manager.js --global pnpm

# Via project config
node scripts/setup-package-manager.js --project bun

# Detect current setting
node scripts/setup-package-manager.js --detect
undefined

Or use the `/setup-pm` command in Claude Code.

### Hook Runtime Controls

[](https://github.com/affaan-m/everything-claude-code#hook-runtime-controls)

Use runtime flags to tune strictness or disable specific hooks temporarily:

undefinedshell
# Hook strictness profile (default: standard)
export ECC_HOOK_PROFILE=standard

# Comma-separated hook IDs to disable
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
undefined

* * *

## 📦 What's Inside

[](https://github.com/affaan-m/everything-claude-code#-whats-inside)

This repo is a **Claude Code plugin** - install it directly or copy components manually.

```
everything-claude-code/
|-- .claude-plugin/   # Plugin and marketplace manifests
|   |-- plugin.json         # Plugin metadata and component paths
|   |-- marketplace.json    # Marketplace catalog for /plugin marketplace add
|
|-- agents/           # 28 specialized subagents for delegation
|   |-- planner.md           # Feature implementation planning
|   |-- architect.md         # System design decisions
|   |-- tdd-guide.md         # Test-driven development
|   |-- code-reviewer.md     # Quality and security review
|   |-- security-reviewer.md # Vulnerability analysis
|   |-- build-error-resolver.md
|   |-- e2e-runner.md        # Playwright E2E testing
|   |-- refactor-cleaner.md  # Dead code cleanup
|   |-- doc-updater.md       # Documentation sync
|   |-- docs-lookup.md       # Documentation/API lookup
|   |-- chief-of-staff.md    # Communication triage and drafts
|   |-- loop-operator.md     # Autonomous loop execution
|   |-- harness-optimizer.md # Harness config tuning
|   |-- cpp-reviewer.md      # C++ code review
|   |-- cpp-build-resolver.md # C++ build error resolution
|   |-- go-reviewer.md       # Go code review
|   |-- go-build-resolver.md # Go build error resolution
|   |-- python-reviewer.md   # Python code review
|   |-- database-reviewer.md # Database/Supabase review
|   |-- typescript-reviewer.md # TypeScript/JavaScript code review
|   |-- java-reviewer.md     # Java/Spring Boot code review
|   |-- java-build-resolver.md # Java/Maven/Gradle build errors
|   |-- kotlin-reviewer.md   # Kotlin/Android/KMP code review
|   |-- kotlin-build-resolver.md # Kotlin/Gradle build errors
|   |-- rust-reviewer.md     # Rust code review
|   |-- rust-build-resolver.md # Rust build error resolution
|   |-- pytorch-build-resolver.md # PyTorch/CUDA training errors
|
|-- skills/           # Workflow definitions and domain knowledge
|   |-- coding-standards/           # Language best practices
|   |-- clickhouse-io/              # ClickHouse analytics, queries, data engineering
|   |-- backend-patterns/           # API, database, caching patterns
|   |-- frontend-patterns/          # React, Next.js patterns
|   |-- frontend-slides/            # HTML slide decks and PPTX-to-web presentation workflows (NEW)
|   |-- article-writing/            # Long-form writing in a supplied voice without generic AI tone (NEW)
|   |-- content-engine/             # Multi-platform social content and repurposing workflows (NEW)
|   |-- market-research/            # Source-attributed market, competitor, and investor research (NEW)
|   |-- investor-materials/         # Pitch decks, one-pagers, memos, and financial models (NEW)
|   |-- investor-outreach/          # Personalized fundraising outreach and follow-up (NEW)
|   |-- continuous-learning/        # Auto-extract patterns from sessions (Longform Guide)
|   |-- continuous-learning-v2/     # Instinct-based learning with confidence scoring
|   |-- iterative-retrieval/        # Progressive context refinement for subagents
|   |-- strategic-compact/          # Manual compaction suggestions (Longform Guide)
|   |-- tdd-workflow/               # TDD methodology
|   |-- security-review/            # Security checklist
|   |-- eval-harness/               # Verification loop evaluation (Longform Guide)
|   |-- verification-loop/          # Continuous verification (Longform Guide)
|   |-- videodb/                   # Video and audio: ingest, search, edit, generate, stream (NEW)
|   |-- golang-patterns/            # Go idioms and best practices
|   |-- golang-testing/             # Go testing patterns, TDD, benchmarks
|   |-- cpp-coding-standards/         # C++ coding standards from C++ Core Guidelines (NEW)
|   |-- cpp-testing/                # C++ testing with GoogleTest, CMake/CTest (NEW)
|   |-- django-patterns/            # Django patterns, models, views (NEW)
|   |-- django-security/            # Django security best practices (NEW)
|   |-- django-tdd/                 # Django TDD workflow (NEW)
|   |-- django-verification/        # Django verification loops (NEW)
|   |-- laravel-patterns/           # Laravel architecture patterns (NEW)
|   |-- laravel-security/           # Laravel security best practices (NEW)
|   |-- laravel-tdd/                # Laravel TDD workflow (NEW)
|   |-- laravel-verification/       # Laravel verification loops (NEW)
|   |-- python-patterns/            # Python idioms and best practices (NEW)
|   |-- python-testing/             # Python testing with pytest (NEW)
|   |-- springboot-patterns/        # Java Spring Boot patterns (NEW)
|   |-- springboot-security/        # Spring Boot security (NEW)
|   |-- springboot-tdd/             # Spring Boot TDD (NEW)
|   |-- springboot-verification/    # Spring Boot verification (NEW)
|   |-- configure-ecc/              # Interactive installation wizard (NEW)
|   |-- security-scan/              # AgentShield security auditor integration (NEW)
|   |-- java-coding-standards/     # Java coding standards (NEW)
|   |-- jpa-patterns/              # JPA/Hibernate patterns (NEW)
|   |-- postgres-patterns/         # PostgreSQL optimization patterns (NEW)
|   |-- nutrient-document-processing/ # Document processing with Nutrient API (NEW)
|   |-- project-guidelines-example/   # Template for project-specific skills
|   |-- database-migrations/         # Migration patterns (Prisma, Drizzle, Django, Go) (NEW)
|   |-- api-design/                  # REST API design, pagination, error responses (NEW)
|   |-- deployment-patterns/         # CI/CD, Docker, health checks, rollbacks (NEW)
|   |-- docker-patterns/            # Docker Compose, networking, volumes, container security (NEW)
|   |-- e2e-testing/                 # Playwright E2E patterns and Page Object Model (NEW)
|   |-- content-hash-cache-pattern/  # SHA-256 content hash caching for file processing (NEW)
|   |-- cost-aware-llm-pipeline/     # LLM cost optimization, model routing, budget tracking (NEW)
|   |-- regex-vs-llm-structured-text/ # Decision framework: regex vs LLM for text parsing (NEW)
|   |-- swift-actor-persistence/     # Thread-safe Swift data persistence with actors (NEW)
|   |-- swift-protocol-di-testing/   # Protocol-based DI for testable Swift code (NEW)
|   |-- search-first/               # Research-before-coding workflow (NEW)
|   |-- skill-stocktake/            # Audit skills and commands for quality (NEW)
|   |-- liquid-glass-design/         # iOS 26 Liquid Glass design system (NEW)
|   |-- foundation-models-on-device/ # Apple on-device LLM with FoundationModels (NEW)
|   |-- swift-concurrency-6-2/       # Swift 6.2 Approachable Concurrency (NEW)
|   |-- perl-patterns/             # Modern Perl 5.36+ idioms and best practices (NEW)
|   |-- perl-security/             # Perl security patterns, taint mode, safe I/O (NEW)
|   |-- perl-testing/              # Perl TDD with Test2::V0, prove, Devel::Cover (NEW)
|   |-- autonomous-loops/           # Autonomous loop patterns: sequential pipelines, PR loops, DAG orchestration (NEW)
|   |-- plankton-code-quality/      # Write-time code quality enforcement with Plankton hooks (NEW)
|
|-- commands/         # Slash commands for quick execution
|   |-- tdd.md              # /tdd - Test-driven development
|   |-- plan.md             # /plan - Implementation planning
|   |-- e2e.md              # /e2e - E2E test generation
|   |-- code-review.md      # /code-review - Quality review
|   |-- build-fix.md        # /build-fix - Fix build errors
|   |-- refactor-clean.md   # /refactor-clean - Dead code removal
|   |-- learn.md            # /learn - Extract patterns mid-session (Longform Guide)
|   |-- learn-eval.md       # /learn-eval - Extract, evaluate, and save patterns (NEW)
|   |-- checkpoint.md       # /checkpoint - Save verification state (Longform Guide)
|   |-- verify.md           # /verify - Run verification loop (Longform Guide)
|   |-- setup-pm.md         # /setup-pm - Configure package manager
|   |-- go-review.md        # /go-review - Go code review (NEW)
|   |-- go-test.md          # /go-test - Go TDD workflow (NEW)
|   |-- go-build.md         # /go-build - Fix Go build errors (NEW)
|   |-- skill-create.md     # /skill-create - Generate skills from git history (NEW)
|   |-- instinct-status.md  # /instinct-status - View learned instincts (NEW)
|   |-- instinct-import.md  # /instinct-import - Import instincts (NEW)
|   |-- instinct-export.md  # /instinct-export - Export instincts (NEW)
|   |-- evolve.md           # /evolve - Cluster instincts into skills
|   |-- prune.md            # /prune - Delete expired pending instincts (NEW)
|   |-- pm2.md              # /pm2 - PM2 service lifecycle management (NEW)
|   |-- multi-plan.md       # /multi-plan - Multi-agent task decomposition (NEW)
|   |-- multi-execute.md    # /multi-execute - Orchestrated multi-agent workflows (NEW)
|   |-- multi-backend.md    # /multi-backend - Backend multi-service orchestration (NEW)
|   |-- multi-frontend.md   # /multi-frontend - Frontend multi-service orchestration (NEW)
|   |-- multi-workflow.md   # /multi-workflow - General multi-service workflows (NEW)
|   |-- orchestrate.md      # /orchestrate - Multi-agent coordination
|   |-- sessions.md         # /sessions - Session history management
|   |-- eval.md             # /eval - Evaluate against criteria
|   |-- test-coverage.md    # /test-coverage - Test coverage analysis
|   |-- update-docs.md      # /update-docs - Update documentation
|   |-- update-codemaps.md  # /update-codemaps - Update codemaps
|   |-- python-review.md    # /python-review - Python code review (NEW)
|
|-- rules/            # Always-follow guidelines (copy to ~/.claude/rules/)
|   |-- README.md            # Structure overview and installation guide
|   |-- common/              # Language-agnostic principles
|   |   |-- coding-style.md    # Immutability, file organization
|   |   |-- git-workflow.md    # Commit format, PR process
|   |   |-- testing.md         # TDD, 80% coverage requirement
|   |   |-- performance.md     # Model selection, context management
|   |   |-- patterns.md        # Design patterns, skeleton projects
|   |   |-- hooks.md           # Hook architecture, TodoWrite
|   |   |-- agents.md          # When to delegate to subagents
|   |   |-- security.md        # Mandatory security checks
|   |-- typescript/          # TypeScript/JavaScript specific
|   |-- python/              # Python specific
|   |-- golang/              # Go specific
|   |-- swift/               # Swift specific
|   |-- php/                 # PHP specific (NEW)
|
|-- hooks/            # Trigger-based automations
|   |-- README.md                 # Hook documentation, recipes, and customization guide
|   |-- hooks.json                # All hooks config (PreToolUse, PostToolUse, Stop, etc.)
|   |-- memory-persistence/       # Session lifecycle hooks (Longform Guide)
|   |-- strategic-compact/        # Compaction suggestions (Longform Guide)
|
|-- scripts/          # Cross-platform Node.js scripts (NEW)
|   |-- lib/                     # Shared utilities
|   |   |-- utils.js             # Cross-platform file/path/system utilities
|   |   |-- package-manager.js   # Package manager detection and selection
|   |-- hooks/                   # Hook implementations
|   |   |-- session-start.js     # Load context on session start
|   |   |-- session-end.js       # Save state on session end
|   |   |-- pre-compact.js       # Pre-compaction state saving
|   |   |-- suggest-compact.js   # Strategic compaction suggestions
|   |   |-- evaluate-session.js  # Extract patterns from sessions
|   |-- setup-package-manager.js # Interactive PM setup
|
|-- tests/            # Test suite (NEW)
|   |-- lib/                     # Library tests
|   |-- hooks/                   # Hook tests
|   |-- run-all.js               # Run all tests
|
|-- contexts/         # Dynamic system prompt injection contexts (Longform Guide)
|   |-- dev.md              # Development mode context
|   |-- review.md           # Code review mode context
|   |-- research.md         # Research/exploration mode context
|
|-- examples/         # Example configurations and sessions
|   |-- CLAUDE.md             # Example project-level config
|   |-- user-CLAUDE.md        # Example user-level config
|   |-- saas-nextjs-CLAUDE.md   # Real-world SaaS (Next.js + Supabase + Stripe)
|   |-- go-microservice-CLAUDE.md # Real-world Go microservice (gRPC + PostgreSQL)
|   |-- django-api-CLAUDE.md      # Real-world Django REST API (DRF + Celery)
|   |-- laravel-api-CLAUDE.md     # Real-world Laravel API (PostgreSQL + Redis) (NEW)
|   |-- rust-api-CLAUDE.md        # Real-world Rust API (Axum + SQLx + PostgreSQL) (NEW)
|
|-- mcp-configs/      # MCP server configurations
|   |-- mcp-servers.json    # GitHub, Supabase, Vercel, Railway, etc.
|
|-- marketplace.json  # Self-hosted marketplace config (for /plugin marketplace add)
```

* * *

## 🛠️ Ecosystem Tools

[](https://github.com/affaan-m/everything-claude-code#%EF%B8%8F-ecosystem-tools)

### Skill Creator

[](https://github.com/affaan-m/everything-claude-code#skill-creator)

Two ways to generate Claude Code skills from your repository:

#### Option A: Local Analysis (Built-in)

[](https://github.com/affaan-m/everything-claude-code#option-a-local-analysis-built-in)

Use the `/skill-create` command for local analysis without external services:

undefinedshell
/skill-create                    # Analyze current repo
/skill-create --instincts        # Also generate instincts for continuous-learning
undefined

This analyzes your git history locally and generates SKILL.md files.

#### Option B: GitHub App (Advanced)

[](https://github.com/affaan-m/everything-claude-code#option-b-github-app-advanced)

For advanced features (10k+ commits, auto-PRs, team sharing):

[Install GitHub App](https://github.com/apps/skill-creator) | [ecc.tools](https://ecc.tools/)

undefinedshell
# Comment on any issue:
/skill-creator analyze

# Or auto-triggers on push to default branch
undefined

Both options create:

*   **SKILL.md files** - Ready-to-use skills for Claude Code
*   **Instinct collections** - For continuous-learning-v2
*   **Pattern extraction** - Learns from your commit history

### AgentShield — Security Auditor

[](https://github.com/affaan-m/everything-claude-code#agentshield--security-auditor)

> Built at the Claude Code Hackathon (Cerebral Valley x Anthropic, Feb 2026). 1282 tests, 98% coverage, 102 static analysis rules.

Scan your Claude Code configuration for vulnerabilities, misconfigurations, and injection risks.

undefinedshell
# Quick scan (no install needed)
npx ecc-agentshield scan

# Auto-fix safe issues
npx ecc-agentshield scan --fix

# Deep analysis with three Opus 4.6 agents
npx ecc-agentshield scan --opus --stream

# Generate secure config from scratch
npx ecc-agentshield init
undefined

**What it scans:** CLAUDE.md, settings.json, MCP configs, hooks, agent definitions, and skills across 5 categories — secrets detection (14 patterns), permission auditing, hook injection analysis, MCP server risk profiling, and agent config review.

**The `--opus` flag** runs three Claude Opus 4.6 agents in a red-team/blue-team/auditor pipeline. The attacker finds exploit chains, the defender evaluates protections, and the auditor synthesizes both into a prioritized risk assessment. Adversarial reasoning, not just pattern matching.

**Output formats:** Terminal (color-graded A-F), JSON (CI pipelines), Markdown, HTML. Exit code 2 on critical findings for build gates.

Use `/security-scan` in Claude Code to run it, or add to CI with the [GitHub Action](https://github.com/affaan-m/agentshield).

[GitHub](https://github.com/affaan-m/agentshield) | [npm](https://www.npmjs.com/package/ecc-agentshield)

### 🧠 Continuous Learning v2

[](https://github.com/affaan-m/everything-claude-code#-continuous-learning-v2)

The instinct-based learning system automatically learns your patterns:

undefinedshell
/instinct-status        # Show learned instincts with confidence
/instinct-import <file> # Import instincts from others
/instinct-export        # Export your instincts for sharing
/evolve                 # Cluster related instincts into skills
undefined

See `skills/continuous-learning-v2/` for full documentation.

* * *

## 📋 Requirements

[](https://github.com/affaan-m/everything-claude-code#-requirements)

### Claude Code CLI Version

[](https://github.com/affaan-m/everything-claude-code#claude-code-cli-version)

**Minimum version: v2.1.0 or later**

This plugin requires Claude Code CLI v2.1.0+ due to changes in how the plugin system handles hooks.

Check your version:

undefinedshell
claude --version
undefined

### Important: Hooks Auto-Loading Behavior

[](https://github.com/affaan-m/everything-claude-code#important-hooks-auto-loading-behavior)

> ⚠️**For Contributors:** Do NOT add a `"hooks"` field to `.claude-plugin/plugin.json`. This is enforced by a regression test.

Claude Code v2.1+ **automatically loads**`hooks/hooks.json` from any installed plugin by convention. Explicitly declaring it in `plugin.json` causes a duplicate detection error:

```
Duplicate hooks file detected: ./hooks/hooks.json resolves to already-loaded file
```

**History:** This has caused repeated fix/revert cycles in this repo ([#29](https://github.com/affaan-m/everything-claude-code/issues/29), [#52](https://github.com/affaan-m/everything-claude-code/issues/52), [#103](https://github.com/affaan-m/everything-claude-code/issues/103)). The behavior changed between Claude Code versions, leading to confusion. We now have a regression test to prevent this from being reintroduced.

* * *

## 📥 Installation

[](https://github.com/affaan-m/everything-claude-code#-installation)

### Option 1: Install as Plugin (Recommended)

[](https://github.com/affaan-m/everything-claude-code#option-1-install-as-plugin-recommended)

The easiest way to use this repo - install as a Claude Code plugin:

undefinedshell
# Add this repo as a marketplace
/plugin marketplace add affaan-m/everything-claude-code

# Install the plugin
/plugin install everything-claude-code@everything-claude-code
undefined

Or add directly to your `~/.claude/settings.json`:

undefinedjson
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
undefined

This gives you instant access to all commands, agents, skills, and hooks.

> **Note:** The Claude Code plugin system does not support distributing `rules` via plugins ([upstream limitation](https://code.claude.com/docs/en/plugins-reference)). You need to install rules manually:
> 
> 
> 
> undefinedshell
> # Clone the repo first
> git clone https://github.com/affaan-m/everything-claude-code.git
> 
> # Option A: User-level rules (applies to all projects)
> mkdir -p ~/.claude/rules
> cp -r everything-claude-code/rules/common/* ~/.claude/rules/
> cp -r everything-claude-code/rules/typescript/* ~/.claude/rules/   # pick your stack
> cp -r everything-claude-code/rules/python/* ~/.claude/rules/
> cp -r everything-claude-code/rules/golang/* ~/.claude/rules/
> cp -r everything-claude-code/rules/php/* ~/.claude/rules/
> 
> # Option B: Project-level rules (applies to current project only)
> mkdir -p .claude/rules
> cp -r everything-claude-code/rules/common/* .claude/rules/
> cp -r everything-claude-code/rules/typescript/* .claude/rules/     # pick your stack
> undefined

* * *

### 🔧 Option 2: Manual Installation

[](https://github.com/affaan-m/everything-claude-code#-option-2-manual-installation)

If you prefer manual control over what's installed:

undefinedshell
# Clone the repo
git clone https://github.com/affaan-m/everything-claude-code.git

# Copy agents to your Claude config
cp everything-claude-code/agents/*.md ~/.claude/agents/

# Copy rules (common + language-specific)
cp -r everything-claude-code/rules/common/* ~/.claude/rules/
cp -r everything-claude-code/rules/typescript/* ~/.claude/rules/   # pick your stack
cp -r everything-claude-code/rules/python/* ~/.claude/rules/
cp -r everything-claude-code/rules/golang/* ~/.claude/rules/
cp -r everything-claude-code/rules/php/* ~/.claude/rules/

# Copy commands
cp everything-claude-code/commands/*.md ~/.claude/commands/

# Copy skills (core vs niche)
# Recommended (new users): core/general skills only
cp -r everything-claude-code/.agents/skills/* ~/.claude/skills/
cp -r everything-claude-code/skills/search-first ~/.claude/skills/

# Optional: add niche/framework-specific skills only when needed
# for s in django-patterns django-tdd laravel-patterns springboot-patterns; do
#   cp -r everything-claude-code/skills/$s ~/.claude/skills/
# done
undefined

#### Add hooks to settings.json

[](https://github.com/affaan-m/everything-claude-code#add-hooks-to-settingsjson)

Copy the hooks from `hooks/hooks.json` to your `~/.claude/settings.json`.

#### Configure MCPs

[](https://github.com/affaan-m/everything-claude-code#configure-mcps)

Copy desired MCP servers from `mcp-configs/mcp-servers.json` to your `~/.claude.json`.

**Important:** Replace `YOUR_*_HERE` placeholders with your actual API keys.

* * *

## 🎯 Key Concepts

[](https://github.com/affaan-m/everything-claude-code#-key-concepts)

### Agents

[](https://github.com/affaan-m/everything-claude-code#agents)

Subagents handle delegated tasks with limited scope. Example:

undefinedmd
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer...
undefined

### Skills

[](https://github.com/affaan-m/everything-claude-code#skills)

Skills are workflow definitions invoked by commands or agents:

undefinedmd
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
undefined

### Hooks

[](https://github.com/affaan-m/everything-claude-code#hooks)

Hooks fire on tool events. Example - warn about console.log:

undefinedjson
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
undefined

### Rules

[](https://github.com/affaan-m/everything-claude-code#rules)

Rules are always-follow guidelines, organized into `common/` (language-agnostic) + language-specific directories:

```
rules/
  common/          # Universal principles (always install)
  typescript/      # TS/JS specific patterns and tools
  python/          # Python specific patterns and tools
  golang/          # Go specific patterns and tools
  swift/           # Swift specific patterns and tools
  php/             # PHP specific patterns and tools
```

See [`rules/README.md`](https://github.com/affaan-m/everything-claude-code/blob/main/rules/README.md) for installation and structure details.

* * *

## 🗺️ Which Agent Should I Use?

[](https://github.com/affaan-m/everything-claude-code#%EF%B8%8F-which-agent-should-i-use)

Not sure where to start? Use this quick reference:

| I want to... | Use this command | Agent used |
| --- | --- | --- |
| Plan a new feature | `/everything-claude-code:plan "Add auth"` | planner |
| Design system architecture | `/everything-claude-code:plan` + architect agent | architect |
| Write code with tests first | `/tdd` | tdd-guide |
| Review code I just wrote | `/code-review` | code-reviewer |
| Fix a failing build | `/build-fix` | build-error-resolver |
| Run end-to-end tests | `/e2e` | e2e-runner |
| Find security vulnerabilities | `/security-scan` | security-reviewer |
| Remove dead code | `/refactor-clean` | refactor-cleaner |
| Update documentation | `/update-docs` | doc-updater |
| Review Go code | `/go-review` | go-reviewer |
| Review Python code | `/python-review` | python-reviewer |
| Review TypeScript/JavaScript code | _(invoke `typescript-reviewer` directly)_ | typescript-reviewer |
| Audit database queries | _(auto-delegated)_ | database-reviewer |

### Common Workflows

[](https://github.com/affaan-m/everything-claude-code#common-workflows)

**Starting a new feature:**

```
/everything-claude-code:plan "Add user authentication with OAuth"
                                              → planner creates implementation blueprint
/tdd                                          → tdd-guide enforces write-tests-first
/code-review                                  → code-reviewer checks your work
```

**Fixing a bug:**

```
/tdd                                          → tdd-guide: write a failing test that reproduces it
                                              → implement the fix, verify test passes
/code-review                                  → code-reviewer: catch regressions
```

**Preparing for production:**

```
/security-scan                                → security-reviewer: OWASP Top 10 audit
/e2e                                          → e2e-runner: critical user flow tests
/test-coverage                                → verify 80%+ coverage
```

* * *

## ❓ FAQ

[](https://github.com/affaan-m/everything-claude-code#-faq)

**How do I check which agents/commands are installed?**

undefinedshell
/plugin list everything-claude-code@everything-claude-code
undefined

This shows all available agents, commands, and skills from the plugin.

**My hooks aren't working / I see "Duplicate hooks file" errors**
This is the most common issue. **Do NOT add a `"hooks"` field to `.claude-plugin/plugin.json`.** Claude Code v2.1+ automatically loads `hooks/hooks.json` from installed plugins. Explicitly declaring it causes duplicate detection errors. See [#29](https://github.com/affaan-m/everything-claude-code/issues/29), [#52](https://github.com/affaan-m/everything-claude-code/issues/52), [#103](https://github.com/affaan-m/everything-claude-code/issues/103).

**Can I use ECC with Claude Code on a custom API endpoint or model gateway?**
Yes. ECC does not hardcode Anthropic-hosted transport settings. It runs locally through Claude Code's normal CLI/plugin surface, so it works with:

*   Anthropic-hosted Claude Code
*   Official Claude Code gateway setups using `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`
*   Compatible custom endpoints that speak the Anthropic API Claude Code expects

Minimal example:

undefinedshell
export ANTHROPIC_BASE_URL=https://your-gateway.example.com
export ANTHROPIC_AUTH_TOKEN=your-token
claude
undefined

If your gateway remaps model names, configure that in Claude Code rather than in ECC. ECC's hooks, skills, commands, and rules are model-provider agnostic once the `claude` CLI is already working.

Official references:

*   [Claude Code LLM gateway docs](https://docs.anthropic.com/en/docs/claude-code/llm-gateway)
*   [Claude Code model configuration docs](https://docs.anthropic.com/en/docs/claude-code/model-config)

**My context window is shrinking / Claude is running out of context**
Too many MCP servers eat your context. Each MCP tool description consumes tokens from your 200k window, potentially reducing it to ~70k.

**Fix:** Disable unused MCPs per project:

undefinedjson
// In your project's .claude/settings.json
{
  "disabledMcpServers": ["supabase", "railway", "vercel"]
}
undefined

Keep under 10 MCPs enabled and under 80 tools active.

**Can I use only some components (e.g., just agents)?**
Yes. Use Option 2 (manual installation) and copy only what you need:

undefinedshell
# Just agents
cp everything-claude-code/agents/*.md ~/.claude/agents/

# Just rules
cp -r everything-claude-code/rules/common/* ~/.claude/rules/
undefined

Each component is fully independent.

**Does this work with Cursor / OpenCode / Codex / Antigravity?**
Yes. ECC is cross-platform:

*   **Cursor**: Pre-translated configs in `.cursor/`. See [Cursor IDE Support](https://github.com/affaan-m/everything-claude-code#cursor-ide-support).
*   **OpenCode**: Full plugin support in `.opencode/`. See [OpenCode Support](https://github.com/affaan-m/everything-claude-code#-opencode-support).
*   **Codex**: First-class support for both macOS app and CLI, with adapter drift guards and SessionStart fallback. See PR [#257](https://github.com/affaan-m/everything-claude-code/pull/257).
*   **Antigravity**: Tightly integrated setup for workflows, skills, and flattened rules in `.agent/`. See [Antigravity Guide](https://github.com/affaan-m/everything-claude-code/blob/main/docs/ANTIGRAVITY-GUIDE.md).
*   **Claude Code**: Native — this is the primary target.

**How do I contribute a new skill or agent?**
See [CONTRIBUTING.md](https://github.com/affaan-m/everything-claude-code/blob/main/CONTRIBUTING.md). The short version:

1.   Fork the repo
2.   Create your skill in `skills/your-skill-name/SKILL.md` (with YAML frontmatter)
3.   Or create an agent in `agents/your-agent.md`
4.   Submit a PR with a clear description of what it does and when to use it

* * *

## 🧪 Running Tests

[](https://github.com/affaan-m/everything-claude-code#-running-tests)

The plugin includes a comprehensive test suite:

undefinedshell
# Run all tests
node tests/run-all.js

# Run individual test files
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
undefined

* * *

## 🤝 Contributing

[](https://github.com/affaan-m/everything-claude-code#-contributing)

**Contributions are welcome and encouraged.**

This repo is meant to be a community resource. If you have:

*   Useful agents or skills
*   Clever hooks
*   Better MCP configurations
*   Improved rules

Please contribute! See [CONTRIBUTING.md](https://github.com/affaan-m/everything-claude-code/blob/main/CONTRIBUTING.md) for guidelines.

### Ideas for Contributions

[](https://github.com/affaan-m/everything-claude-code#ideas-for-contributions)

*   Language-specific skills (Rust, C#, Kotlin, Java) — Go, Python, Perl, Swift, and TypeScript already included
*   Framework-specific configs (Rails, FastAPI, NestJS) — Django, Spring Boot, Laravel already included
*   DevOps agents (Kubernetes, Terraform, AWS, Docker)
*   Testing strategies (different frameworks, visual regression)
*   Domain-specific knowledge (ML, data engineering, mobile)

* * *

## Cursor IDE Support

[](https://github.com/affaan-m/everything-claude-code#cursor-ide-support)

ECC provides **full Cursor IDE support** with hooks, rules, agents, skills, commands, and MCP configs adapted for Cursor's native format.

### Quick Start (Cursor)

[](https://github.com/affaan-m/everything-claude-code#quick-start-cursor)

undefinedshell
# macOS/Linux
./install.sh --target cursor typescript
./install.sh --target cursor python golang swift php
undefined

undefinedpowershell
# Windows PowerShell
.\install.ps1 --target cursor typescript
.\install.ps1 --target cursor python golang swift php
undefined

### What's Included

[](https://github.com/affaan-m/everything-claude-code#whats-included)

| Component | Count | Details |
| --- | --- | --- |
| Hook Events | 15 | sessionStart, beforeShellExecution, afterFileEdit, beforeMCPExecution, beforeSubmitPrompt, and 10 more |
| Hook Scripts | 16 | Thin Node.js scripts delegating to `scripts/hooks/` via shared adapter |
| Rules | 34 | 9 common (alwaysApply) + 25 language-specific (TypeScript, Python, Go, Swift, PHP) |
| Agents | Shared | Via AGENTS.md at root (read by Cursor natively) |
| Skills | Shared + Bundled | Via AGENTS.md at root and `.cursor/skills/` for translated additions |
| Commands | Shared | `.cursor/commands/` if installed |
| MCP Config | Shared | `.cursor/mcp.json` if installed |

### Hook Architecture (DRY Adapter Pattern)

[](https://github.com/affaan-m/everything-claude-code#hook-architecture-dry-adapter-pattern)

Cursor has **more hook events than Claude Code** (20 vs 8). The `.cursor/hooks/adapter.js` module transforms Cursor's stdin JSON to Claude Code's format, allowing existing `scripts/hooks/*.js` to be reused without duplication.

```
Cursor stdin JSON → adapter.js → transforms → scripts/hooks/*.js
                                              (shared with Claude Code)
```

Key hooks:

*   **beforeShellExecution** — Blocks dev servers outside tmux (exit 2), git push review
*   **afterFileEdit** — Auto-format + TypeScript check + console.log warning
*   **beforeSubmitPrompt** — Detects secrets (sk-, ghp_, AKIA patterns) in prompts
*   **beforeTabFileRead** — Blocks Tab from reading .env, .key, .pem files (exit 2)
*   **beforeMCPExecution / afterMCPExecution** — MCP audit logging

### Rules Format

[](https://github.com/affaan-m/everything-claude-code#rules-format)

Cursor rules use YAML frontmatter with `description`, `globs`, and `alwaysApply`:

undefinedyaml
---
description: "TypeScript coding style extending common rules"
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: false
---
undefined

* * *

## Codex macOS App + CLI Support

[](https://github.com/affaan-m/everything-claude-code#codex-macos-app--cli-support)

ECC provides **first-class Codex support** for both the macOS app and CLI, with a reference configuration, Codex-specific AGENTS.md supplement, and shared skills.

### Quick Start (Codex App + CLI)

[](https://github.com/affaan-m/everything-claude-code#quick-start-codex-app--cli)

undefinedshell
# Run Codex CLI in the repo — AGENTS.md and .codex/ are auto-detected
codex

# Automatic setup: sync ECC assets (AGENTS.md, skills, MCP servers) into ~/.codex
npm install && bash scripts/sync-ecc-to-codex.sh
# or: pnpm install && bash scripts/sync-ecc-to-codex.sh
# or: yarn install && bash scripts/sync-ecc-to-codex.sh
# or: bun install && bash scripts/sync-ecc-to-codex.sh

# Or manually: copy the reference config to your home directory
cp .codex/config.toml ~/.codex/config.toml
undefined

The sync script safely merges ECC MCP servers into your existing `~/.codex/config.toml` using an **add-only** strategy — it never removes or modifies your existing servers. Run with `--dry-run` to preview changes, or `--update-mcp` to force-refresh ECC servers to the latest recommended config.

Codex macOS app:

*   Open this repository as your workspace.
*   The root `AGENTS.md` is auto-detected.
*   `.codex/config.toml` and `.codex/agents/*.toml` work best when kept project-local.
*   The reference `.codex/config.toml` intentionally does not pin `model` or `model_provider`, so Codex uses its own current default unless you override it.
*   Optional: copy `.codex/config.toml` to `~/.codex/config.toml` for global defaults; keep the multi-agent role files project-local unless you also copy `.codex/agents/`.

### What's Included

[](https://github.com/affaan-m/everything-claude-code#whats-included-1)

| Component | Count | Details |
| --- | --- | --- |
| Config | 1 | `.codex/config.toml` — top-level approvals/sandbox/web_search, MCP servers, notifications, profiles |
| AGENTS.md | 2 | Root (universal) + `.codex/AGENTS.md` (Codex-specific supplement) |
| Skills | 16 | `.agents/skills/` — SKILL.md + agents/openai.yaml per skill |
| MCP Servers | 6 | Supabase, Playwright, Context7, GitHub, Memory, Sequential Thinking (auto-merged via add-only sync) |
| Profiles | 2 | `strict` (read-only sandbox) and `yolo` (full auto-approve) |
| Agent Roles | 3 | `.codex/agents/` — explorer, reviewer, docs-researcher |

### Skills

[](https://github.com/affaan-m/everything-claude-code#skills-1)

Skills at `.agents/skills/` are auto-loaded by Codex:

| Skill | Description |
| --- | --- |
| tdd-workflow | Test-driven development with 80%+ coverage |
| security-review | Comprehensive security checklist |
| coding-standards | Universal coding standards |
| frontend-patterns | React/Next.js patterns |
| frontend-slides | HTML presentations, PPTX conversion, visual style exploration |
| article-writing | Long-form writing from notes and voice references |
| content-engine | Platform-native social content and repurposing |
| market-research | Source-attributed market and competitor research |
| investor-materials | Decks, memos, models, and one-pagers |
| investor-outreach | Personalized outreach, follow-ups, and intro blurbs |
| backend-patterns | API design, database, caching |
| e2e-testing | Playwright E2E tests |
| eval-harness | Eval-driven development |
| strategic-compact | Context management |
| api-design | REST API design patterns |
| verification-loop | Build, test, lint, typecheck, security |

### Key Limitation

[](https://github.com/affaan-m/everything-claude-code#key-limitation)

Codex does **not yet provide Claude-style hook execution parity**. ECC enforcement there is instruction-based via `AGENTS.md`, optional `model_instructions_file` overrides, and sandbox/approval settings.

### Multi-Agent Support

[](https://github.com/affaan-m/everything-claude-code#multi-agent-support)

Current Codex builds support experimental multi-agent workflows.

*   Enable `features.multi_agent = true` in `.codex/config.toml`
*   Define roles under `[agents.<name>]`
*   Point each role at a file under `.codex/agents/`
*   Use `/agent` in the CLI to inspect or steer child agents

ECC ships three sample role configs:

| Role | Purpose |
| --- | --- |
| `explorer` | Read-only codebase evidence gathering before edits |
| `reviewer` | Correctness, security, and missing-test review |
| `docs_researcher` | Documentation and API verification before release/docs changes |

* * *

## 🔌 OpenCode Support

[](https://github.com/affaan-m/everything-claude-code#-opencode-support)

ECC provides **full OpenCode support** including plugins and hooks.

### Quick Start

[](https://github.com/affaan-m/everything-claude-code#quick-start)

undefinedshell
# Install OpenCode
npm install -g opencode

# Run in the repository root
opencode
undefined

The configuration is automatically detected from `.opencode/opencode.json`.

### Feature Parity

[](https://github.com/affaan-m/everything-claude-code#feature-parity)

| Feature | Claude Code | OpenCode | Status |
| --- | --- | --- | --- |
| Agents | ✅ 28 agents | ✅ 12 agents | **Claude Code leads** |
| Commands | ✅ 60 commands | ✅ 31 commands | **Claude Code leads** |
| Skills | ✅ 119 skills | ✅ 37 skills | **Claude Code leads** |
| Hooks | ✅ 8 event types | ✅ 11 events | **OpenCode has more!** |
| Rules | ✅ 29 rules | ✅ 13 instructions | **Claude Code leads** |
| MCP Servers | ✅ 14 servers | ✅ Full | **Full parity** |
| Custom Tools | ✅ Via hooks | ✅ 6 native tools | **OpenCode is better** |

### Hook Support via Plugins

[](https://github.com/affaan-m/everything-claude-code#hook-support-via-plugins)

OpenCode's plugin system is MORE sophisticated than Claude Code with 20+ event types:

| Claude Code Hook | OpenCode Plugin Event |
| --- | --- |
| PreToolUse | `tool.execute.before` |
| PostToolUse | `tool.execute.after` |
| Stop | `session.idle` |
| SessionStart | `session.created` |
| SessionEnd | `session.deleted` |

**Additional OpenCode events**: `file.edited`, `file.watcher.updated`, `message.updated`, `lsp.client.diagnostics`, `tui.toast.show`, and more.

### Available Commands (31+)

[](https://github.com/affaan-m/everything-claude-code#available-commands-31)

| Command | Description |
| --- | --- |
| `/plan` | Create implementation plan |
| `/tdd` | Enforce TDD workflow |
| `/code-review` | Review code changes |
| `/build-fix` | Fix build errors |
| `/e2e` | Generate E2E tests |
| `/refactor-clean` | Remove dead code |
| `/orchestrate` | Multi-agent workflow |
| `/learn` | Extract patterns from session |
| `/checkpoint` | Save verification state |
| `/verify` | Run verification loop |
| `/eval` | Evaluate against criteria |
| `/update-docs` | Update documentation |
| `/update-codemaps` | Update codemaps |
| `/test-coverage` | Analyze coverage |
| `/go-review` | Go code review |
| `/go-test` | Go TDD workflow |
| `/go-build` | Fix Go build errors |
| `/python-review` | Python code review (PEP 8, type hints, security) |
| `/multi-plan` | Multi-model collaborative planning |
| `/multi-execute` | Multi-model collaborative execution |
| `/multi-backend` | Backend-focused multi-model workflow |
| `/multi-frontend` | Frontend-focused multi-model workflow |
| `/multi-workflow` | Full multi-model development workflow |
| `/pm2` | Auto-generate PM2 service commands |
| `/sessions` | Manage session history |
| `/skill-create` | Generate skills from git |
| `/instinct-status` | View learned instincts |
| `/instinct-import` | Import instincts |
| `/instinct-export` | Export instincts |
| `/evolve` | Cluster instincts into skills |
| `/promote` | Promote project instincts to global scope |
| `/projects` | List known projects and instinct stats |
| `/prune` | Delete expired pending instincts (30d TTL) |
| `/learn-eval` | Extract and evaluate patterns before saving |
| `/setup-pm` | Configure package manager |
| `/harness-audit` | Audit harness reliability, eval readiness, and risk posture |
| `/loop-start` | Start controlled agentic loop execution pattern |
| `/loop-status` | Inspect active loop status and checkpoints |
| `/quality-gate` | Run quality gate checks for paths or entire repo |
| `/model-route` | Route tasks to models by complexity and budget |

### Plugin Installation

[](https://github.com/affaan-m/everything-claude-code#plugin-installation)

**Option 1: Use directly**

undefinedshell
cd everything-claude-code
opencode
undefined

**Option 2: Install as npm package**

undefinedshell
npm install ecc-universal
undefined

Then add to your `opencode.json`:

undefinedjson
{
  "plugin": ["ecc-universal"]
}
undefined

That npm plugin entry enables ECC's published OpenCode plugin module (hooks/events and plugin tools). It does **not** automatically add ECC's full command/agent/instruction catalog to your project config.

For the full ECC OpenCode setup, either:

*   run OpenCode inside this repository, or
*   copy the bundled `.opencode/` config assets into your project and wire the `instructions`, `agent`, and `command` entries in `opencode.json`

### Documentation

[](https://github.com/affaan-m/everything-claude-code#documentation)

*   **Migration Guide**: `.opencode/MIGRATION.md`
*   **OpenCode Plugin README**: `.opencode/README.md`
*   **Consolidated Rules**: `.opencode/instructions/INSTRUCTIONS.md`
*   **LLM Documentation**: `llms.txt` (complete OpenCode docs for LLMs)

* * *

## Cross-Tool Feature Parity

[](https://github.com/affaan-m/everything-claude-code#cross-tool-feature-parity)

ECC is the **first plugin to maximize every major AI coding tool**. Here's how each harness compares:

| Feature | Claude Code | Cursor IDE | Codex CLI | OpenCode |
| --- | --- | --- | --- | --- |
| **Agents** | 21 | Shared (AGENTS.md) | Shared (AGENTS.md) | 12 |
| **Commands** | 52 | Shared | Instruction-based | 31 |
| **Skills** | 102 | Shared | 10 (native format) | 37 |
| **Hook Events** | 8 types | 15 types | None yet | 11 types |
| **Hook Scripts** | 20+ scripts | 16 scripts (DRY adapter) | N/A | Plugin hooks |
| **Rules** | 34 (common + lang) | 34 (YAML frontmatter) | Instruction-based | 13 instructions |
| **Custom Tools** | Via hooks | Via hooks | N/A | 6 native tools |
| **MCP Servers** | 14 | Shared (mcp.json) | 7 (auto-merged via TOML parser) | Full |
| **Config Format** | settings.json | hooks.json + rules/ | config.toml | opencode.json |
| **Context File** | CLAUDE.md + AGENTS.md | AGENTS.md | AGENTS.md | AGENTS.md |
| **Secret Detection** | Hook-based | beforeSubmitPrompt hook | Sandbox-based | Hook-based |
| **Auto-Format** | PostToolUse hook | afterFileEdit hook | N/A | file.edited hook |
| **Version** | Plugin | Plugin | Reference config | 1.9.0 |

**Key architectural decisions:**

*   **AGENTS.md** at root is the universal cross-tool file (read by all 4 tools)
*   **DRY adapter pattern** lets Cursor reuse Claude Code's hook scripts without duplication
*   **Skills format** (SKILL.md with YAML frontmatter) works across Claude Code, Codex, and OpenCode
*   Codex's lack of hooks is compensated by `AGENTS.md`, optional `model_instructions_file` overrides, and sandbox permissions

* * *

## 📖 Background

[](https://github.com/affaan-m/everything-claude-code#-background)

I've been using Claude Code since the experimental rollout. Won the Anthropic x Forum Ventures hackathon in Sep 2025 with [@DRodriguezFX](https://x.com/DRodriguezFX) — built [zenith.chat](https://zenith.chat/) entirely using Claude Code.

These configs are battle-tested across multiple production applications.

* * *

## Token Optimization

[](https://github.com/affaan-m/everything-claude-code#token-optimization)

Claude Code usage can be expensive if you don't manage token consumption. These settings significantly reduce costs without sacrificing quality.

### Recommended Settings

[](https://github.com/affaan-m/everything-claude-code#recommended-settings)

Add to `~/.claude/settings.json`:

undefinedjson
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  }
}
undefined

| Setting | Default | Recommended | Impact |
| --- | --- | --- | --- |
| `model` | opus | **sonnet** | ~60% cost reduction; handles 80%+ of coding tasks |
| `MAX_THINKING_TOKENS` | 31,999 | **10,000** | ~70% reduction in hidden thinking cost per request |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50** | Compacts earlier — better quality in long sessions |

Switch to Opus only when you need deep architectural reasoning:

```
/model opus
```

### Daily Workflow Commands

[](https://github.com/affaan-m/everything-claude-code#daily-workflow-commands)

| Command | When to Use |
| --- | --- |
| `/model sonnet` | Default for most tasks |
| `/model opus` | Complex architecture, debugging, deep reasoning |
| `/clear` | Between unrelated tasks (free, instant reset) |
| `/compact` | At logical task breakpoints (research done, milestone complete) |
| `/cost` | Monitor token spending during session |

### Strategic Compaction

[](https://github.com/affaan-m/everything-claude-code#strategic-compaction)

The `strategic-compact` skill (included in this plugin) suggests `/compact` at logical breakpoints instead of relying on auto-compaction at 95% context. See `skills/strategic-compact/SKILL.md` for the full decision guide.

**When to compact:**

*   After research/exploration, before implementation
*   After completing a milestone, before starting the next
*   After debugging, before continuing feature work
*   After a failed approach, before trying a new one

**When NOT to compact:**

*   Mid-implementation (you'll lose variable names, file paths, partial state)

### Context Window Management

[](https://github.com/affaan-m/everything-claude-code#context-window-management)

**Critical:** Don't enable all MCPs at once. Each MCP tool description consumes tokens from your 200k window, potentially reducing it to ~70k.

*   Keep under 10 MCPs enabled per project
*   Keep under 80 tools active
*   Use `disabledMcpServers` in project config to disable unused ones

### Agent Teams Cost Warning

[](https://github.com/affaan-m/everything-claude-code#agent-teams-cost-warning)

Agent Teams spawns multiple context windows. Each teammate consumes tokens independently. Only use for tasks where parallelism provides clear value (multi-module work, parallel reviews). For simple sequential tasks, subagents are more token-efficient.

* * *

## ⚠️ Important Notes

[](https://github.com/affaan-m/everything-claude-code#%EF%B8%8F-important-notes)

### Token Optimization

[](https://github.com/affaan-m/everything-claude-code#token-optimization-1)

Hitting daily limits? See the **[Token Optimization Guide](https://github.com/affaan-m/everything-claude-code/blob/main/docs/token-optimization.md)** for recommended settings and workflow tips.

Quick wins:

undefinedjson
// ~/.claude/settings.json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
undefined

Use `/clear` between unrelated tasks, `/compact` at logical breakpoints, and `/cost` to monitor spending.

### Customization

[](https://github.com/affaan-m/everything-claude-code#customization)

These configs work for my workflow. You should:

1.   Start with what resonates
2.   Modify for your stack
3.   Remove what you don't use
4.   Add your own patterns

* * *

## 💜 Sponsors

[](https://github.com/affaan-m/everything-claude-code#-sponsors)

This project is free and open source. Sponsors help keep it maintained and growing.

[**Become a Sponsor**](https://github.com/sponsors/affaan-m) | [Sponsor Tiers](https://github.com/affaan-m/everything-claude-code/blob/main/SPONSORS.md) | [Sponsorship Program](https://github.com/affaan-m/everything-claude-code/blob/main/SPONSORING.md)

* * *

## 🌟 Star History

[](https://github.com/affaan-m/everything-claude-code#-star-history)

[![Image 21: Star History Chart](https://camo.githubusercontent.com/a045e07cab46719b1fb2c828f4f10fd57a973be3a6317991a1e435123e501834/68747470733a2f2f6170692e737461722d686973746f72792e636f6d2f7376673f7265706f733d61666661616e2d6d2f65766572797468696e672d636c617564652d636f646526747970653d44617465)](https://star-history.com/#affaan-m/everything-claude-code&Date)

* * *

## 🔗 Links

[](https://github.com/affaan-m/everything-claude-code#-links)

*   **Shorthand Guide (Start Here):**[The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
*   **Longform Guide (Advanced):**[The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
*   **Security Guide:**[Security Guide](https://github.com/affaan-m/everything-claude-code/blob/main/the-security-guide.md) | [Thread](https://x.com/affaanmustafa/status/2033263813387223421)
*   **Follow:**[@affaanmustafa](https://x.com/affaanmustafa)

* * *

## 📄 License

[](https://github.com/affaan-m/everything-claude-code#-license)

MIT - Use freely, modify as needed, contribute back if you can.

* * *

**Star this repo if it helps. Read both guides. Build something great.**

## About

The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.

[ecc.tools](https://ecc.tools/ "https://ecc.tools")

### Topics

[productivity](https://github.com/topics/productivity "Topic: productivity")[mcp](https://github.com/topics/mcp "Topic: mcp")[developer-tools](https://github.com/topics/developer-tools "Topic: developer-tools")[ai-agents](https://github.com/topics/ai-agents "Topic: ai-agents")[claude](https://github.com/topics/claude "Topic: claude")[llm](https://github.com/topics/llm "Topic: llm")[anthropic](https://github.com/topics/anthropic "Topic: anthropic")[claude-code](https://github.com/topics/claude-code "Topic: claude-code")

### Resources

[Readme](https://github.com/affaan-m/everything-claude-code#readme-ov-file)

### License

[MIT license](https://github.com/affaan-m/everything-claude-code#MIT-1-ov-file)

### Code of conduct

[Code of conduct](https://github.com/affaan-m/everything-claude-code#coc-ov-file)

### Contributing

[Contributing](https://github.com/affaan-m/everything-claude-code#contributing-ov-file)

### Security policy

[Security policy](https://github.com/affaan-m/everything-claude-code#security-ov-file)

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/affaan-m/everything-claude-code).

[Activity](https://github.com/affaan-m/everything-claude-code/activity)

### Stars

[**98.9k** stars](https://github.com/affaan-m/everything-claude-code/stargazers)

### Watchers

[**525** watching](https://github.com/affaan-m/everything-claude-code/watchers)

### Forks

[**12.9k** forks](https://github.com/affaan-m/everything-claude-code/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2Faffaan-m%2Feverything-claude-code&report=affaan-m+%28user%29)

## [Releases 11](https://github.com/affaan-m/everything-claude-code/releases)

[v1.9.0 — Selective Install, ECC Tools Pro, 12 Language Ecosystems Latest Mar 21, 2026](https://github.com/affaan-m/everything-claude-code/releases/tag/v1.9.0)

[+ 10 releases](https://github.com/affaan-m/everything-claude-code/releases)

## Sponsor this project

*   [![Image 22: @affaan-m](https://avatars.githubusercontent.com/u/124439313?s=64&v=4)](https://github.com/affaan-m)[**affaan-m**Affaan Mustafa](https://github.com/affaan-m)[](https://github.com/sponsors/affaan-m)

*   [https://ecc.tools](https://ecc.tools/)

[Learn more about GitHub Sponsors](https://github.com/sponsors)

## [Packages 0](https://github.com/users/affaan-m/packages?repo_name=everything-claude-code)

 No packages published 

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/affaan-m/everything-claude-code).

## [Contributors 113](https://github.com/affaan-m/everything-claude-code/graphs/contributors)

*   [![Image 23: @affaan-m](https://avatars.githubusercontent.com/u/124439313?s=64&v=4)](https://github.com/affaan-m)
*   [![Image 24: @pangerlkr](https://avatars.githubusercontent.com/u/73515951?s=64&v=4)](https://github.com/pangerlkr)
*   [![Image 25: @claude](https://avatars.githubusercontent.com/u/81847?s=64&v=4)](https://github.com/claude)
*   [![Image 26: @Copilot](https://avatars.githubusercontent.com/in/1143301?s=64&v=4)](https://github.com/apps/copilot-swe-agent)
*   [![Image 27: @pvgomes](https://avatars.githubusercontent.com/u/4427450?s=64&v=4)](https://github.com/pvgomes)
*   [![Image 28: @shimo4228](https://avatars.githubusercontent.com/u/54734315?s=64&v=4)](https://github.com/shimo4228)
*   [![Image 29: @dowithless](https://avatars.githubusercontent.com/u/165774507?s=64&v=4)](https://github.com/dowithless)
*   [![Image 30: @OkminLee](https://avatars.githubusercontent.com/u/18339886?s=64&v=4)](https://github.com/OkminLee)
*   [![Image 31: @hahmee](https://avatars.githubusercontent.com/u/42745666?s=64&v=4)](https://github.com/hahmee)
*   [![Image 32: @pythonstrup](https://avatars.githubusercontent.com/u/90585081?s=64&v=4)](https://github.com/pythonstrup)
*   [![Image 33: @chris-yyau](https://avatars.githubusercontent.com/u/255700750?s=64&v=4)](https://github.com/chris-yyau)
*   [![Image 34: @greptile-apps[bot]](https://avatars.githubusercontent.com/in/867647?s=64&v=4)](https://github.com/apps/greptile-apps)
*   [![Image 35: @zdocapp](https://avatars.githubusercontent.com/u/217164482?s=64&v=4)](https://github.com/zdocapp)
*   [![Image 36: @Nomadu27](https://avatars.githubusercontent.com/u/229521013?s=64&v=4)](https://github.com/Nomadu27)

[+ 99 contributors](https://github.com/affaan-m/everything-claude-code/graphs/contributors)

## Languages

*   [JavaScript 86.4%](https://github.com/affaan-m/everything-claude-code/search?l=javascript)
*   [Python 6.9%](https://github.com/affaan-m/everything-claude-code/search?l=python)
*   [Shell 4.8%](https://github.com/affaan-m/everything-claude-code/search?l=shell)
*   [TypeScript 1.9%](https://github.com/affaan-m/everything-claude-code/search?l=typescript)

## Footer

[](https://github.com/) © 2026 GitHub,Inc. 

### Footer navigation

*   [Terms](https://docs.github.com/site-policy/github-terms/github-terms-of-service)
*   [Privacy](https://docs.github.com/site-policy/privacy-policies/github-privacy-statement)
*   [Security](https://github.com/security)
*   [Status](https://www.githubstatus.com/)
*   [Community](https://github.community/)
*   [Docs](https://docs.github.com/)
*   [Contact](https://support.github.com/?tags=dotcom-footer)
*    Manage cookies 
*    Do not share my personal information 

 You can’t perform that action at this time.

