const url = "https://ofgfurrbwawymvpughac.supabase.co";

async function testConnection() {
    try {
        console.log(`Testing connection to ${url}...`);
        const response = await fetch(url);
        console.log(`Status: ${response.status}`);
        console.log("Connection successful!");
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testConnection();
