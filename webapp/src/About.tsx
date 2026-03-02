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
              But then there's Splitwise. I use it to track debts with friends.
              The problem is that my "personal" expense tracking needs to
              include my share of what I pay in Splitwise, so it couldn't really
              be automated. For years, I manually copied entries from Splitwise
              to Toshl.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              The Solution
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Around 2019, I decided to automate this. I wrote a CLI python
              script to sync Splitwise to Toshl. It turned a lot of manual data
              entry into about 30 minutes of work a month.
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              In 2024, a Python update broke the original script. Instead of
              fixing it, I recoded the whole thing as a web app.
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
              The Modern (AI Enabled) Way
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              Now, with AI, we can go a step further. This app doesn't just sync
              two services anymore, it allows data entry in a much more
              convenient way.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You can now:
            </Typography>
            <Box component="ul" sx={{ mt: 0, pl: 2 }}>
              <Typography component="li" variant="body1" color="text.secondary">
                Extract details from screenshots of receipts or bills (with a
                different AI tool)
              </Typography>
              <Typography component="li" variant="body1" color="text.secondary">
                Upload CSVs from your bank
              </Typography>
              <Typography component="li" variant="body1" color="text.secondary">
                Batch import everything into either splitwise or toshl
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              You still get to review everything (to make sure the AI didn't
              hallucinate things), but the hard work is done for you.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              This whole thing could probably be fully automated with AI, but I
              still have trust issues and want to see everything myself.
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}

export default About;
