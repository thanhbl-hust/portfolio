import { useRef } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRevealChildren } from '../hooks/useRevealChildren'
import { AboutTerminal } from '../components/AboutTerminal'
import { PeopleScene } from '../components/PeopleScene'

export function PortfolioPage() {
  useDocumentTitle('Bui Lam Thanh')
  const bodyRef = useRef<HTMLDivElement>(null)
  useRevealChildren(bodyRef)

  return (
    <article className="article">
      <PeopleScene />

      <AboutTerminal />

      <div className="article__body" ref={bodyRef}>
        <h2 id="about">About Me</h2>
        <p>
          Replace this paragraph with a short introduction: who you are, what you work on day to
          day, and what this site is for. Two or three sentences is plenty &mdash; the articles do
          the rest of the talking.
        </p>

        <h2 id="skills">Skills</h2>
        <ul>
          <li>Cloud: AWS</li>
          <li>Infrastructure: Terraform (TFLint, tfsec, Checkov), Docker, Kubernetes, Helm, Kafka, Message Queues</li>
          <li>CI/CD: GitHub Actions, Jenkins, ArgoCD</li>
          <li>Observability & Security: Prometheus, Grafana, ELK, Opentelemetry,FluentBit, Trivy, Gitleaks</li>
          <li>Languages: Python, Bash, YAML</li>
        </ul>

        <h2 id="projects">Projects</h2>
        <h3 id="project-one">Project One</h3>
        <p>
          One paragraph describing the project, the problem it solved, and the stack used.{' '}
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            Link to repo or demo
          </a>
          .
        </p>

        <h3 id="project-two">Project Two</h3>
        <p>Same format as above &mdash; keep each project short and scannable.</p>

        <h2 id="experience">Experience</h2>
        <p>
          <strong>Senior  Engineer</strong> &mdash; Company Name (2023 &ndash; Present)
          <br />
          One line on scope and impact.
        </p>
        <p>
          <strong>DevOps Engineer</strong> &mdash; Company Name (2020 &ndash; 2023)
          <br />
          One line on scope and impact.
        </p>

        <h2 id="contact">Contact / Links</h2>
        <ul>
          <li>
            Email: <a href="mailto:lamthanhbui02@gmail.com">lamthanhbui02@gmail.com</a>
          </li>
          <li>
            GitHub:{' '}
            <a href="https://github.com/thanhbl-hust" target="_blank" rel="noopener noreferrer">
              github.com/thanhbl-hust
            </a>
          </li>
          <li>
            LinkedIn:{' '}
            <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer">
              linkedin.com/in/yourusername
            </a>
          </li>
        </ul>
      </div>
    </article>
  )
}
