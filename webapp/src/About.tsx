import Typography from "@mui/material/Typography";
import { Box, Container, Link, Stack } from "@mui/material";

function About() {
  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 600 }}>
          About
        </Typography>

        <Stack spacing={3} sx={{ mt: 3 }}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              The Problem
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              I've been tracking my expenses since 2009. I started with manual
              entry on a Windows Mobile phone and eventually moved to Toshl.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Then there's Splitwise. I use it to track debts with friends. The
              problem is that my "personal" expense tracking needs to include my
              share of what I pay in Splitwise, so it couldn't really be
              automated. For years, I manually copied entries from Splitwise to
              Toshl.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              The Original Workflow (2019-2025)
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Around 2019, I decided to automate this. I wrote a CLI python
              script to sync Splitwise to Toshl. It turned a hours of manual
              data entry into about 30 minutes of work a month. In 2024, a
              Python update broke the original script. Instead of fixing it, I
              recoded the whole thing as a web app.
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              Unfortunately, this only solved the syncing between Splitwise and
              Toshl, it didn't solve the data entry part which was entirely
              manual.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You can read more about my original setup in my{" "}
              <Link
                href="https://chaijiaxun.com/blog/tracking-my-expenses/"
                target="_blank"
                rel="noopener noreferrer">
                blog post
              </Link>
              .
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              The AI Enabled Way (2026)
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              There are now multiple tools to help with different parts of the
              process.
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              The biggest improvement is with data entry, something that was
              still a manual process before this update. There are new tools to
              bulk import into Splitwise and Toshl, which were built to
              complement existing consumer AI services. I'd use those to take
              screenshots, or otherwise unstructured data into a standardised
              CSV, then the importers will let me get them into splitwise /
              toshl while still giving me full control over exactly what goes
              in.
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              The original Splitwise to Toshl tool continues to exist to sync
              between the two services.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              The Future?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              I'm aware this whole thing hinges on Splitwise and Toshl
              continuing to exist and with so much custom tooling, at this point
              I might as well just vibe-code a custom solution to manage debts
              and expenses.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Alternatively, why not just ask Claude to fully automate this?
              <br />
              As mentioned in the original blog post. I want to make spending
              money slightly tedious so I feel the pain when spending. And also
              AI won't have context as to what my expenses are. A charge on my
              card doesn't necessarily mean it's my expense. One day, I might
              have an always on camera that will get all necessary context. By
              then I don't know if having data even matters anymore.
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}

export default About;
