import { ProjectDefinition } from '@angular-devkit/core/src/workspace';
import { Rule, Tree, chain } from '@angular-devkit/schematics';

import { VERSION } from '../../../../version';
import { readRequiredFile } from '../../../utility/tree';
import { getWorkspace, updateWorkspace } from '../../../utility/workspace';

const COMPAT_CSS_FILE_NAME = `skyux${VERSION.major}-compat.css`;

interface CompatStyle {
  libraries: {
    name: string;
    components: {
      name: string;
      styles: { css: string; instructions: string }[];
    }[];
  }[];
}

const compatStyles: CompatStyle = {
  libraries: [
    {
      name: '@skyux/theme',
      components: [
        {
          name: 'styles',
          styles: [
            {
              css: `
:root {
  --sky-compat-example: 0;
}
`,
              instructions: `
This is an example and should be removed.`,
            },
          ],
        },
      ],
    },
  ],
};

function getProjectSourcePath(projectDefinition: ProjectDefinition): string {
  /*istanbul ignore else*/
  if (projectDefinition.sourceRoot) {
    return `${projectDefinition.sourceRoot}/app`;
  } else {
    return `${projectDefinition.root}/src/app`;
  }
}

function buildCommentBlock(message: string): string {
  return `/${'*'.repeat(79)}
 * ${message.replace(/(?![^\n]{1,75}$)([^\n]{1,75})\s/g, '$1\n * ')}
 ${'*'.repeat(79)}/`;
}

function buildComponentCss(component: {
  name: string;
  styles: { css: string; instructions: string }[];
}): string {
  let contents = buildCommentBlock(
    `COMPONENT: ${component.name.toUpperCase()}`,
  );

  for (const style of component.styles) {
    contents += `

${buildCommentBlock(style.instructions.trim())}

${style.css.trim()}
`;
  }

  return contents;
}

function writeStylesheet(sourceRoot: string, contents: string): Rule {
  const filePath = `${sourceRoot}/${COMPAT_CSS_FILE_NAME}`;

  return (tree) => {
    if (tree.exists(filePath)) {
      tree.overwrite(filePath, contents);
    } else {
      tree.create(filePath, contents);
    }
  };
}

function addStylesheetToWorkspace(): Rule {
  return () =>
    updateWorkspace((workspace) => {
      for (const project of workspace.projects.values()) {
        for (const targetName of ['build', 'test']) {
          if (project.extensions['projectType'] === 'application') {
            const target = project.targets.get(targetName);
            const sourceRoot = getProjectSourcePath(project);
            const filePath = `${sourceRoot}/${COMPAT_CSS_FILE_NAME}`;

            /* istanbul ignore else */
            if (target && target.options) {
              const styles = (target.options['styles'] = (target.options[
                'styles'
              ] || []) as string[]);

              if (!styles.includes(filePath)) {
                styles.push(filePath);
              }
            }
          }
        }
      }
    });
}

function getCompatStyles(tree: Tree): string | undefined {
  let contents = '';

  const packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } = JSON.parse(readRequiredFile(tree, '/package.json'));

  for (const library of compatStyles.libraries) {
    if (
      packageJson.dependencies?.[library.name] ||
      packageJson.devDependencies?.[library.name]
    ) {
      for (const component of library.components) {
        contents += `
${buildComponentCss(component)}`;
      }
    }
  }

  return contents
    ? `${buildCommentBlock(
        `TODO: The following component libraries introduced visual breaking ` +
          `changes in SKY UX ${VERSION.major}. Each block of CSS reintroduces ` +
          `the styles that were changed or removed for backward compatibility. ` +
          `You will need to do the following before migrating to the next major ` +
          `version of SKY UX:
- Address each of the changes by following the instructions
  in each block of CSS, then remove the block.
- Delete this file after all blocks have been addressed.
- Remove each occurrence of this file in your project's
  angular.json file.`,
      )}
${contents}`
    : undefined;
}

export default function (): Rule {
  return async (tree) => {
    const { workspace } = await getWorkspace(tree);
    const styles = getCompatStyles(tree);
    const rules: Rule[] = [];

    for (const [, projectDefinition] of workspace.projects.entries()) {
      if (projectDefinition.extensions['projectType'] === 'application') {
        if (styles) {
          const sourcePath = getProjectSourcePath(projectDefinition);
          rules.push(writeStylesheet(sourcePath, styles));
        }
      }
    }

    if (styles) {
      rules.push(addStylesheetToWorkspace());
    }

    return chain(rules);
  };
}
