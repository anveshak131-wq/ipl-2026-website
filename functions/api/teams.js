/**
 * Cloudflare Pages Function for teams API
 * Handles GET, POST, PUT, DELETE operations for teams
 */

// Helper function to verify admin token
function verifyAdminToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}

// Default mock teams
const defaultTeams = [
  {
    id: "1",
    league: "ipl",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_premium.svg",
    description:
      "One of the most popular IPL teams known for their aggressive batting",
    colors: { primary: "#EC1C24", secondary: "#000000" },
    trophies: [],
    homeGrounds: ["M. Chinnaswamy Stadium"],
  },
  {
    id: "2",
    league: "ipl",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/mi_logo_new.svg",
    description: "The most successful IPL team with 5 championship titles",
    colors: { primary: "#004BA0", secondary: "#FFFFFF" },
    trophies: [
      { year: 2013, name: "IPL Champions" },
      { year: 2015, name: "IPL Champions" },
      { year: 2017, name: "IPL Champions" },
      { year: 2019, name: "IPL Champions" },
      { year: 2023, name: "IPL Champions" },
    ],
    homeGrounds: ["Wankhede Stadium"],
  },
  {
    id: "3",
    league: "ipl",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/logos/srh_logo_new.svg",
    description:
      "Known for their strong bowling attack and consistent performances",
    colors: { primary: "#FF822A", secondary: "#000000" },
    trophies: [{ year: 2016, name: "IPL Champions" }],
    homeGrounds: ["Arun Jaitley Stadium", "Rajiv Gandhi International Stadium"],
  },
  {
    id: "4",
    league: "ipl",
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/logos/gt_logo_new.svg",
    description:
      "The newest powerhouse team that won IPL in their debut season",
    colors: { primary: "#1B2130", secondary: "#E15454" },
    trophies: [{ year: 2022, name: "IPL Champions" }],
    homeGrounds: ["Arun Jaitley Stadium", "Narendra Modi Stadium"],
  },
  {
    id: "5",
    league: "ipl",
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/logos/kxip_logo_new.svg",
    description: "Known for their explosive batting and never-say-die attitude",
    colors: { primary: "#ED1D24", secondary: "#FBDD0B" },
    trophies: [],
    homeGrounds: ["PCA Stadium", "Arun Jaitley Stadium"],
  },
  {
    id: "6",
    league: "ipl",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/dc_logo_new.svg",
    description:
      "Young and dynamic team with a perfect blend of experience and youth",
    colors: { primary: "#0078BC", secondary: "#EF1B26" },
    trophies: [],
    homeGrounds: ["Arun Jaitley Stadium"],
  },
  {
    id: "7",
    league: "ipl",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/logos/lsg_logo_new.svg",
    description: "The newest franchise making waves with their balanced squad",
    colors: { primary: "#9C2A2C", secondary: "#F7E17D" },
    trophies: [],
    homeGrounds: [
      "ARUN JAITLEY STADIUM",
      "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium",
    ],
  },
  {
    id: "8",
    league: "ipl",
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/logos/rr_logo_new.svg",
    description: "The inaugural IPL champions known for nurturing young talent",
    colors: { primary: "#EA1A85", secondary: "#004B8D" },
    trophies: [{ year: 2008, name: "IPL Champions" }],
    homeGrounds: ["Arun Jaitley Stadium", "Sawai Mansingh Stadium"],
  },
  {
    id: "9",
    league: "ipl",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/logos/kkr_logo_new.svg",
    description: "Two-time champions with a massive fan following",
    colors: { primary: "#3A225D", secondary: "#B9975B" },
    trophies: [
      { year: 2012, name: "IPL Champions" },
      { year: 2014, name: "IPL Champions" },
    ],
    homeGrounds: ["Eden Gardens"],
  },
  {
    id: "10",
    league: "ipl",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    description: "The Yellow Army led by the legendary MS Dhoni",
    colors: { primary: "#FFB90F", secondary: "#0081E8" }, // Force redeploy - CSK color fix
    trophies: [
      { year: 2010, name: "IPL Champions" },
      { year: 2011, name: "IPL Champions" },
      { year: 2018, name: "IPL Champions" },
      { year: 2021, name: "IPL Champions" },
    ],
    homeGrounds: ["M. A. Chidambaram Stadium"],
  },
  // WPL Teams (IDs 11-15)
  {
    id: "11",
    league: "wpl",
    name: "Mumbai Indians (WPL)",
    shortName: "MI-W",
    logo: "/logos/wpl_mi_logo_animated.svg",
    description:
      "The women's franchise of Mumbai Indians bringing championship pedigree",
    colors: { primary: "#004BA0", secondary: "#FFD700" },
    trophies: [],
    homeGrounds: ["Wankhede Stadium, Mumbai"],
  },
  {
    id: "12",
    league: "wpl",
    name: "Royal Challengers Bangalore (WPL)",
    shortName: "RCB-W",
    logo: "/logos/wpl_rcb_logo_animated.svg",
    description: "The women's franchise of RCB with explosive talent",
    colors: { primary: "#C8102E", secondary: "#FFD700" },
    trophies: [
      {
        year: 2024,
        title: "WPL Champions",
        season: "WPL 2024",
      },
    ],
    homeGrounds: ["M. Chinnaswamy Stadium, Bengaluru"],
  },
  {
    id: "13",
    league: "wpl",
    name: "Delhi Capitals (WPL)",
    shortName: "DC-W",
    logo: "/logos/wpl_dc_logo_animated.svg",
    description:
      "The women's franchise of Delhi Capitals combining youth and experience",
    colors: { primary: "#004BA0", secondary: "#DC2626" },
    trophies: [],
    homeGrounds: ["Arun Jaitley Stadium, Delhi"],
  },
  {
    id: "14",
    league: "wpl",
    name: "Gujarat Giants (WPL)",
    shortName: "GG",
    logo: "/logos/wpl_gg_logo_animated.svg",
    description: "The women's franchise of Gujarat Giants aiming for glory",
    colors: { primary: "#F97316", secondary: "#FFD700" },
    trophies: [],
    homeGrounds: ["Narendra Modi Stadium, Ahmedabad"],
  },
  {
    id: "15",
    league: "wpl",
    name: "UP Warriorz (WPL)",
    shortName: "UPW",
    logo: "/logos/wpl_upw_logo_animated.svg",
    description:
      "The women's franchise of UP Warriorz bringing fierce competition",
    colors: { primary: "#059669", secondary: "#F97316" },
    trophies: [],
    homeGrounds: [
      "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow",
    ],
  },
];

// Main request handler
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  // Enable CORS
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // GET - Debug endpoint to check deployment
  if (url.pathname === "/api/teams/debug") {
    return new Response(
      JSON.stringify({
        message: "Debug endpoint working",
        timestamp: new Date().toISOString(),
        version: "2026-01-20-fix",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // GET - Retrieve all teams
  async function handleGetRequest(context) {
    const { env, request } = context;

    try {
      // Get league query parameter
      const url = new URL(request.url);
      const league = url.searchParams.get("league");

      // Always use default teams as primary source to avoid KV issues
      console.log("Using default teams as primary source");
      let teams = defaultTeams;

      // Try to get teams from KV storage only if default teams fail
      if (!teams || teams.length === 0) {
        try {
          if (env && env.IPL_CACHE) {
            const cachedTeams = await env.IPL_CACHE.get("teams");
            if (cachedTeams) {
              teams = JSON.parse(cachedTeams);
              console.log(`Loaded ${teams.length} teams from KV cache as fallback`);
            } else {
              console.log("No teams found in KV cache, using defaults");
            }
          } else {
            console.log("IPL_CACHE not available, using default teams");
          }
        } catch (error) {
          console.error("Error reading teams from KV:", error);
          console.log("Falling back to default teams due to KV error");
        }
      }

      // Final fallback - ensure we always have teams
      if (!teams || teams.length === 0) {
        console.log("All sources failed, using hardcoded default teams");
        teams = defaultTeams;
      }

      // Filter by league if specified
      if (league && (league === "ipl" || league === "wpl")) {
        teams = teams.filter((team) => {
          // If team doesn't have league property, default to 'ipl' for backward compatibility
          const teamLeague = team.league || "ipl";
          return teamLeague === league;
        });
      }

      // Ensure all teams have league property (migration for existing data)
      teams = teams.map((team) => ({
        ...team,
        league: team.league || "ipl", // Default to 'ipl' if missing
        id: String(team.id), // Normalize IDs to strings
      }));

      // Deduplicate teams by shortName (handles both string/number ID duplicates)
      const uniqueTeamsMap = new Map();
      for (const team of teams) {
        try {
          // Use shortName as key to deduplicate (some teams have both "11" and 11 as IDs)
          // Only process teams that have a shortName
          if (team.shortName) {
            if (!uniqueTeamsMap.has(team.shortName)) {
              uniqueTeamsMap.set(team.shortName, team);
            }
          } else {
            // For teams without shortName, use ID as fallback
            const teamId = String(team.id);
            if (!uniqueTeamsMap.has(teamId)) {
              uniqueTeamsMap.set(teamId, team);
            }
          }
        } catch (error) {
          console.error('Error processing team in deduplication:', team, error);
          // Skip problematic team but continue processing others
          continue;
        }
      }
      const uniqueTeams = Array.from(uniqueTeamsMap.values());

      console.log(`Teams processing: Original=${teams.length}, Unique=${uniqueTeams.length}`);

      // If duplicates were found, update KV storage with clean data
      if (uniqueTeams.length < teams.length) {
        console.log(
          `Found ${teams.length - uniqueTeams.length} duplicate teams, cleaning up...`,
        );
        try {
          if (env && env.IPL_CACHE) {
            await env.IPL_CACHE.put("teams", JSON.stringify(uniqueTeams));
            console.log("Updated KV cache with unique teams");
          } else {
            console.log("IPL_CACHE not available, skipping unique teams KV update");
          }
        } catch (kvError) {
          console.error("Error updating KV cache with unique teams:", kvError);
          // Continue without updating KV cache
        }
        teams = uniqueTeams;
      } else {
        teams = uniqueTeams;
      }

      return new Response(JSON.stringify(teams), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (error) {
      console.error("Error retrieving teams:", error);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve teams" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // POST - Create a new team
  async function handlePostRequest(context) {
    const { env, request } = context;

    // Verify admin authentication
    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const {
        name,
        shortName,
        logo,
        description,
        colors,
        trophies,
        homeGrounds,
        league,
      } = body;

      // Validate required fields (logo is optional)
      if (!name || !shortName || !description) {
        return new Response(
          JSON.stringify({
            error:
              "Missing required fields: name, shortName, and description are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate league value
      if (league && league !== "ipl" && league !== "wpl") {
        return new Response(
          JSON.stringify({
            error: 'Invalid league value. Must be "ipl" or "wpl"',
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get existing teams
      let teams = (await env.IPL_CACHE.get("teams", "json")) || defaultTeams;

      // Ensure all existing teams have league property
      teams = teams.map((t) => ({
        ...t,
        league: t.league || "ipl",
      }));

      // Generate new ID
      const newId = String(
        Math.max(...teams.map((t) => parseInt(t.id) || 0), 0) + 1,
      );

      // Determine default logo based on league and shortName if not provided
      let defaultLogo = "";
      if (!logo) {
        // For WPL teams, use the animated logo path
        if (league === "wpl") {
          const wplLogoMap = {
            "MI-W": "/logos/wpl_mi_logo_animated.svg",
            "RCB-W": "/logos/wpl_rcb_logo_animated.svg",
            "DC-W": "/logos/wpl_dc_logo_animated.svg",
            GG: "/logos/wpl_gg_logo_animated.svg",
            UPW: "/logos/wpl_upw_logo_animated.svg",
          };
          defaultLogo = wplLogoMap[shortName.trim().toUpperCase()] || "";
        } else {
          // For IPL teams, use a generic IPL logo or leave empty for frontend to handle
          defaultLogo = "";
        }
      }

      // Create new team with proper league assignment
      const newTeam = {
        id: newId,
        league: league || "ipl", // Use provided league or default to 'ipl'
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        logo: logo || defaultLogo, // Use provided logo or calculated default (empty string will be handled by frontend)
        description: description.trim(),
        colors: colors || {
          primary: league === "wpl" ? "#9333EA" : "#6B46C1",
          secondary: league === "wpl" ? "#EC4899" : "#FFD700",
        },
        trophies: trophies || [],
        homeGrounds: homeGrounds || [],
        players: [], // Initialize empty players array
      };

      console.log(
        `Creating new team: ${newTeam.name} (${newTeam.shortName}) for league: ${newTeam.league}`,
      );

      // Add to teams array
      teams.push(newTeam);

      // Save to KV
      await env.IPL_CACHE.put("teams", JSON.stringify(teams));

      console.log(
        `Team created successfully. Total teams: ${teams.length}, WPL teams: ${teams.filter((t) => t.league === "wpl").length}`,
      );

      return new Response(JSON.stringify(newTeam), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating team:", error);
      return new Response(
        JSON.stringify({ error: `Failed to create team: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // PUT - Update an existing team
  // Teams API - Updated with Bangalore naming - Deployed at 2026-01-20 team
  async function handlePutRequest(context) {
    const { env, request } = context;

    // Verify admin authentication
    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const {
        id,
        name,
        shortName,
        logo,
        description,
        colors,
        trophies,
        homeGrounds,
        league,
        stats,
      } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Team ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get existing teams
      let teams = (await env.IPL_CACHE.get("teams", "json")) || defaultTeams;

      // Find and update team
      const teamIndex = teams.findIndex((t) => t.id === id);

      if (teamIndex === -1) {
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updatedTeam = {
        ...teams[teamIndex],
        ...(name && { name }),
        ...(shortName && { shortName }),
        ...(logo && { logo }),
        ...(description && { description }),
        ...(colors && { colors }),
        ...(trophies !== undefined && { trophies }),
        ...(homeGrounds !== undefined && { homeGrounds }),
        ...(league && { league }), // Update league if provided
      };

      // Always update stats if provided, even if it's an object
      if (stats !== undefined && stats !== null) {
        updatedTeam.stats = stats;
      }

      // Log for debugging
      console.log("Updating team:", id, "with stats:", stats);

      // Ensure league property exists (default to existing or 'ipl')
      if (!updatedTeam.league) {
        updatedTeam.league = teams[teamIndex].league || "ipl";
      }

      teams[teamIndex] = updatedTeam;

      // Save to KV
      await env.IPL_CACHE.put("teams", JSON.stringify(teams));

      console.log(
        "Team saved successfully:",
        updatedTeam.name,
        "Stats:",
        updatedTeam.stats,
      );

      return new Response(JSON.stringify(updatedTeam), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating team:", error);
      return new Response(JSON.stringify({ error: "Failed to update team" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // DELETE - Delete a team
  async function handleDeleteRequest(context) {
    const { env, request } = context;

    // Verify admin authentication
    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(request.url);
      const teamId = url.searchParams.get("id");

      if (!teamId) {
        return new Response(JSON.stringify({ error: "Team ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get existing teams
      let teams = (await env.IPL_CACHE.get("teams", "json")) || defaultTeams;

      // Filter out the team to delete
      const filteredTeams = teams.filter((t) => t.id !== teamId);

      if (filteredTeams.length === teams.length) {
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Save to KV
      await env.IPL_CACHE.put("teams", JSON.stringify(filteredTeams));

      return new Response(
        JSON.stringify({ success: true, message: "Team deleted" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error deleting team:", error);
      return new Response(JSON.stringify({ error: "Failed to delete team" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Route dispatch for main handler
    // Determine base path for teams
    const pathname = url.pathname;

    if (method === "GET") {
      // If not debug path, handle teams listing
      if (pathname === "/api/teams" || pathname === "/api/teams/") {
        return await handleGetRequest(context);
      }
    }

    if (
      method === "POST" &&
      (pathname === "/api/teams" || pathname === "/api/teams/")
    ) {
      return await handlePostRequest(context);
    }

    if (
      method === "PUT" &&
      (pathname === "/api/teams" || pathname === "/api/teams/")
    ) {
      return await handlePutRequest(context);
    }

    if (
      method === "DELETE" &&
      (pathname === "/api/teams" || pathname === "/api/teams/")
    ) {
      return await handleDeleteRequest(context);
    }

    // Method not allowed or route not found
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } // end onRequest
}

// Force redeploy
